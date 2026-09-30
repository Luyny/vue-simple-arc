import { describe, it, expect, beforeAll } from 'vitest';
import { mount } from '@vue/test-utils';
import { createSSRApp, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import SimpleArc, { SimpleArcComponent } from '../src';

const WIDTH = 200;

beforeAll(() => {
    // jsdom não calcula layout; simula um container de 200px
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => WIDTH });
});

const paths = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('path');

// Extrai o ponto inicial "M x y" do atributo d
const startPoint = (d: string) => {
    const [, x, y] = d.split(' ');
    return { x: Number(x), y: Number(y) };
};

describe('SimpleArc', () => {
    it('exporta SimpleArcComponent como alias', () => {
        expect(SimpleArcComponent).toBe(SimpleArc);
    });

    it('desenha trilha e arco principal', () => {
        const wrapper = mount(SimpleArc, { props: { value: 0.5 } });
        const [track, main] = paths(wrapper);
        expect(paths(wrapper)).toHaveLength(2);
        expect(track.attributes('stroke')).toBe('#80808040');
        expect(main.attributes('stroke')).toBe('#41b883');

        // 50% do meio arco termina no topo: (centro, thickness/2)
        const p = startPoint(main.attributes('d')!);
        expect(p.x).toBeCloseTo(WIDTH / 2);
        expect(p.y).toBeCloseTo(4);
    });

    it('não desenha o arco principal quando value é 0', () => {
        const wrapper = mount(SimpleArc, { props: { value: 0 } });
        expect(paths(wrapper)).toHaveLength(1);
    });

    it('limita value acima de 1 ao arco completo', () => {
        const wrapper = mount(SimpleArc, { props: { value: 1.5 } });
        const [track, main] = paths(wrapper);
        expect(main.attributes('d')).toBe(track.attributes('d'));
        expect(wrapper.attributes('aria-valuenow')).toBe('100');
    });

    it('trata value negativo ou NaN como 0', async () => {
        const wrapper = mount(SimpleArc, { props: { value: -0.3 } });
        expect(paths(wrapper)).toHaveLength(1);
        expect(wrapper.attributes('aria-valuenow')).toBe('0');

        await wrapper.setProps({ value: NaN });
        expect(paths(wrapper)).toHaveLength(1);
        expect(wrapper.attributes('aria-valuenow')).toBe('0');
    });

    it('redesenha quando value muda', async () => {
        const wrapper = mount(SimpleArc, { props: { value: 0 } });
        await wrapper.setProps({ value: 0.25 });
        expect(paths(wrapper)).toHaveLength(2);
        expect(wrapper.attributes('aria-valuenow')).toBe('25');
    });

    it('usa altura igual à largura no círculo completo', async () => {
        const half = mount(SimpleArc, { props: { value: 0.5, thickness: 10 } });
        const full = mount(SimpleArc, { props: { value: 0.5, thickness: 10, fullCircle: true } });
        await nextTick();
        expect(half.find('svg').attributes('height')).toBe(String(WIDTH / 2 + 5));
        expect(full.find('svg').attributes('height')).toBe(String(WIDTH));
    });

    it('expõe atributos de acessibilidade e repassa aria-label', () => {
        const wrapper = mount(SimpleArc, { props: { value: 0.72 }, attrs: { 'aria-label': 'Meta de vendas' } });
        expect(wrapper.attributes('role')).toBe('progressbar');
        expect(wrapper.attributes('aria-valuemin')).toBe('0');
        expect(wrapper.attributes('aria-valuemax')).toBe('100');
        expect(wrapper.attributes('aria-valuenow')).toBe('72');
        expect(wrapper.attributes('aria-label')).toBe('Meta de vendas');
    });

    it('não repete id entre instâncias', () => {
        const a = mount(SimpleArc, { props: { value: 0.1 } });
        const b = mount(SimpleArc, { props: { value: 0.2 } });
        expect(a.attributes('id')).toBeUndefined();
        expect(b.attributes('id')).toBeUndefined();
        expect(a.classes()).toContain('simple-arc');
    });

    it('renderiza o slot', () => {
        const wrapper = mount(SimpleArc, { props: { value: 0.5 }, slots: { default: '<b>50%</b>' } });
        expect(wrapper.find('b').text()).toBe('50%');
    });

    it('renderiza no servidor sem erro', async () => {
        const html = await renderToString(createSSRApp({ render: () => h(SimpleArc, { value: 0.5 }) }));
        expect(html).toContain('role="progressbar"');
        expect(html).toContain('aria-valuenow="50"');
    });
});
