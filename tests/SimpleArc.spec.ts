import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import SimpleArc, { SimpleArcComponent } from '../src';

// Diferente da largura de fallback (200) para provar que a medição acontece
const WIDTH = 300;
let currentWidth = WIDTH;

// jsdom não tem ResizeObserver; guarda os callbacks para disparar manualmente
const resizeCallbacks = new Set<() => void>();
class ResizeObserverStub {
    constructor(private cb: () => void) {}
    observe() { resizeCallbacks.add(this.cb); }
    disconnect() { resizeCallbacks.delete(this.cb); }
}
const resize = async (width: number) => {
    currentWidth = width;
    resizeCallbacks.forEach(cb => cb());
    await nextTick();
};

const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');

beforeAll(() => {
    // jsdom não calcula layout; simula a largura do container
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => currentWidth });
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterAll(() => {
    if (originalClientWidth) Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth);
    vi.unstubAllGlobals();
});

afterEach(() => {
    currentWidth = WIDTH;
});

// A medição acontece no onMounted; o re-render com a largura real vem no próximo tick
const mountArc = async (...args: Parameters<typeof mount<typeof SimpleArc>>) => {
    const wrapper = mount(...args);
    await nextTick();
    return wrapper;
};

const paths = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('path');
const main = (wrapper: ReturnType<typeof mount>) => paths(wrapper)[1];
const dashoffset = (wrapper: ReturnType<typeof mount>) => Number(main(wrapper).element.style.strokeDashoffset);

const ssr = (props: Record<string, unknown>) =>
    renderToString(createSSRApp({ render: () => h(SimpleArc, props as never) }));

describe('SimpleArc', () => {
    it('exporta SimpleArcComponent como alias', () => {
        expect(SimpleArcComponent).toBe(SimpleArc);
    });

    it('desenha trilha e arco principal sobre o mesmo caminho', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.5 } });
        const [track, arc] = paths(wrapper);
        expect(track.attributes('stroke')).toBe('#80808040');
        expect(arc.attributes('stroke')).toBe('#41b883');
        expect(arc.attributes('d')).toBe(track.attributes('d'));
        expect(arc.attributes('pathLength')).toBe('100');
    });

    it('meio arco vai da esquerda para a direita por cima, recuado em thickness/2', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.5 } });
        expect(paths(wrapper)[0].attributes('d')).toBe('M 4 150 A 146 146 0 0 1 296 150');
    });

    it('círculo é fechado com dois meios arcos', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.5, fullCircle: true } });
        expect(paths(wrapper)[0].attributes('d')).toBe('M 4 150 A 146 146 0 0 1 296 150 A 146 146 0 0 1 4 150');
    });

    it('círculo continua desenhável em containers minúsculos', async () => {
        currentWidth = 12;
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.5, fullCircle: true } });
        expect(paths(wrapper)[0].attributes('d')).toBe('M 4 6 A 2 2 0 0 1 8 6 A 2 2 0 0 1 4 6');
    });

    it('controla o progresso por stroke-dashoffset', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.25 } });
        expect(dashoffset(wrapper)).toBeCloseTo(75);
    });

    it('esconde o arco principal quando value é 0, sem removê-lo', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0 } });
        expect(paths(wrapper)).toHaveLength(2);
        expect(main(wrapper).attributes('stroke-opacity')).toBe('0');
        expect(dashoffset(wrapper)).toBe(100);
    });

    it('limita value acima de 1 ao arco completo', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 1.5 } });
        expect(dashoffset(wrapper)).toBe(0);
        expect(wrapper.attributes('aria-valuenow')).toBe('100');
    });

    it('trata value negativo ou NaN como 0', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: -0.3 } });
        expect(main(wrapper).attributes('stroke-opacity')).toBe('0');
        expect(wrapper.attributes('aria-valuenow')).toBe('0');

        await wrapper.setProps({ value: NaN });
        expect(main(wrapper).attributes('stroke-opacity')).toBe('0');
        expect(wrapper.attributes('aria-valuenow')).toBe('0');
    });

    it('mudar value só mexe no dashoffset, no mesmo elemento', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.25 } });
        const before = { el: main(wrapper).element, d: main(wrapper).attributes('d'), viewBox: wrapper.find('svg').attributes('viewBox') };
        await wrapper.setProps({ value: 0.75 });
        expect(main(wrapper).element).toBe(before.el);
        expect(main(wrapper).attributes('d')).toBe(before.d);
        expect(wrapper.find('svg').attributes('viewBox')).toBe(before.viewBox);
        expect(dashoffset(wrapper)).toBeCloseTo(25);
        expect(wrapper.attributes('aria-valuenow')).toBe('75');
    });

    it('anima de 0 e de volta a 0, escondendo o ponto só após recolher', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0 } });
        const el = main(wrapper).element as SVGPathElement;

        await wrapper.setProps({ value: 0.6 });
        expect(main(wrapper).element).toBe(el);
        expect(el.getAttribute('stroke-opacity')).toBe('1');
        expect(el.style.transition).toContain('stroke-dashoffset');
        expect(el.style.transition).not.toContain('stroke-opacity');

        await wrapper.setProps({ value: 0 });
        expect(el.getAttribute('stroke-opacity')).toBe('0');
        expect(el.style.transition).toContain('stroke-opacity 0s linear var(--simple-arc-duration, 0.4s)');
    });

    it('transição usa as variáveis de duração e easing', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.5 } });
        expect(main(wrapper).element.style.transition)
            .toBe('stroke-dashoffset var(--simple-arc-duration, 0.4s) var(--simple-arc-easing, ease)');
    });

    it('desliga a transição com prefers-reduced-motion', async () => {
        vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }));
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.5 } });
        expect(main(wrapper).element.style.transition).toBe('none');
        vi.stubGlobal('matchMedia', undefined);
    });

    it('resize atualiza geometria sem mexer no progresso', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.4 } });
        await resize(500);
        expect(wrapper.find('svg').attributes('viewBox')).toBe('0 0 500 254');
        expect(paths(wrapper)[0].attributes('d')).toBe('M 4 250 A 246 246 0 0 1 496 250');
        expect(dashoffset(wrapper)).toBeCloseTo(60);
    });

    it('container oculto (largura 0) mantém a última largura válida', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.4 } });
        await resize(0);
        expect(wrapper.find('svg').attributes('viewBox')).toBe(`0 0 ${WIDTH} ${WIDTH / 2 + 4}`);
    });

    it('para de observar ao desmontar', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.4 } });
        const before = resizeCallbacks.size;
        expect(before).toBeGreaterThan(0);
        wrapper.unmount();
        expect(resizeCallbacks.size).toBe(before - 1);
    });

    it('usa viewBox com a largura medida e altura conforme o formato', async () => {
        const half = await mountArc(SimpleArc, { props: { value: 0.5, thickness: 10 } });
        const full = await mountArc(SimpleArc, { props: { value: 0.5, thickness: 10, fullCircle: true } });
        expect(half.find('svg').attributes('viewBox')).toBe(`0 0 ${WIDTH} ${WIDTH / 2 + 5}`);
        expect(full.find('svg').attributes('viewBox')).toBe(`0 0 ${WIDTH} ${WIDTH}`);
    });

    it('trackThickness padrão é thickness/5 e pode ser definida', async () => {
        const def = await mountArc(SimpleArc, { props: { value: 0.5, thickness: 10 } });
        expect(paths(def)[0].attributes('stroke-width')).toBe('2');

        const custom = await mountArc(SimpleArc, { props: { value: 0.5, thickness: 10, trackThickness: 20 } });
        expect(paths(custom)[0].attributes('stroke-width')).toBe('20');
        // Trilha mais grossa define o recuo e a altura
        expect(paths(custom)[0].attributes('d')).toBe('M 10 150 A 140 140 0 0 1 290 150');
        expect(custom.find('svg').attributes('viewBox')).toBe(`0 0 ${WIDTH} ${WIDTH / 2 + 10}`);
    });

    it('trackColor define a cor da trilha e tem precedência sobre secondColor', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const track = await mountArc(SimpleArc, { props: { value: 0.5, trackColor: '#111' } });
        expect(paths(track)[0].attributes('stroke')).toBe('#111');

        const legacy = await mountArc(SimpleArc, { props: { value: 0.5, secondColor: '#222' } });
        expect(paths(legacy)[0].attributes('stroke')).toBe('#222');

        const both = await mountArc(SimpleArc, { props: { value: 0.5, trackColor: '#111', secondColor: '#222' } });
        expect(paths(both)[0].attributes('stroke')).toBe('#111');
        vi.restoreAllMocks();
    });

    it('avisa uma única vez sobre secondColor obsoleto', async () => {
        // Módulo novo: a flag do aviso não depende de testes anteriores
        vi.resetModules();
        const { default: Fresh } = await import('../src/SimpleArc.vue');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await mountArc(Fresh, { props: { value: 0.5 } });
        expect(warn).not.toHaveBeenCalled();
        await mountArc(Fresh, { props: { value: 0.5, secondColor: '#222' } });
        await mountArc(Fresh, { props: { value: 0.5, secondColor: '#333' } });
        expect(warn).toHaveBeenCalledTimes(1);
        vi.restoreAllMocks();
    });

    it('expõe atributos de acessibilidade e repassa aria-label', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.72 }, attrs: { 'aria-label': 'Meta de vendas' } });
        expect(wrapper.attributes('role')).toBe('progressbar');
        expect(wrapper.attributes('aria-valuemin')).toBe('0');
        expect(wrapper.attributes('aria-valuemax')).toBe('100');
        expect(wrapper.attributes('aria-valuenow')).toBe('72');
        expect(wrapper.attributes('aria-label')).toBe('Meta de vendas');
    });

    it('renderiza o slot', async () => {
        const wrapper = await mountArc(SimpleArc, { props: { value: 0.5 }, slots: { default: '<b>50%</b>' } });
        expect(wrapper.find('b').text()).toBe('50%');
    });

    describe('SSR', () => {
        it('gera o arco completo no HTML do servidor', async () => {
            const html = await ssr({ value: 0.5 });
            expect(html).toContain('role="progressbar"');
            expect(html).toContain('aria-valuenow="50"');
            // Sem medir o DOM, usa a largura de fallback no viewBox
            expect(html).toContain('viewBox="0 0 200 104"');
            expect(html.match(/<path d="M 4 100 A 96 96 0 0 1 196 100"/g)).toHaveLength(2);
            expect(html).toContain('stroke-dashoffset:50');
        });

        it('gera o círculo completo no HTML do servidor', async () => {
            const html = await ssr({ value: 0.3, fullCircle: true });
            expect(html).toContain('viewBox="0 0 200 200"');
            expect(html).toContain('d="M 4 100 A 96 96 0 0 1 196 100 A 96 96 0 0 1 4 100"');
            expect(html).toContain('stroke-dashoffset:70');
        });

        it('hidrata sem mismatch e passa a usar a largura medida', async () => {
            const html = await ssr({ value: 0.5 });
            const el = document.createElement('div');
            el.innerHTML = html;
            document.body.appendChild(el);

            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            createSSRApp({ render: () => h(SimpleArc, { value: 0.5 }) }).mount(el);
            await nextTick();

            const mismatch = [...error.mock.calls, ...warn.mock.calls].some(c => String(c[0]).includes('mismatch'));
            expect(mismatch).toBe(false);
            expect(el.querySelector('svg')!.getAttribute('viewBox')).toBe(`0 0 ${WIDTH} ${WIDTH / 2 + 4}`);

            vi.restoreAllMocks();
            el.remove();
        });
    });
});
