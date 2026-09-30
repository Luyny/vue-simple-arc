<template>
    <div
        ref="container"
        class="simple-arc"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(ratio * 100)"
        :style="{ width: props.width, position: 'relative', margin: 0, padding: 0 }"
    >
        <svg width="100%" :viewBox="`0 0 ${size} ${height}`" style="display: block">
            <path
                :d="arcPath"
                fill="none"
                :stroke="resolvedTrackColor"
                :stroke-width="resolvedTrackThickness"
                stroke-linecap="round"
            />
            <!-- Sempre renderizado para a transição funcionar a partir de 0 e de volta a 0 -->
            <path
                :d="arcPath"
                fill="none"
                :stroke="props.color"
                :stroke-width="props.thickness"
                stroke-linecap="round"
                :pathLength="DASH"
                :stroke-dasharray="`${DASH} ${DASH}`"
                :stroke-opacity="ratio > 0 ? 1 : 0"
                :style="{ strokeDashoffset: DASH * (1 - ratio), transition }"
            />
        </svg>
        <div class="slot" :style="slotStyle"><slot></slot></div>
    </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';

declare const process: { env: Record<string, string | undefined> };

// process.env.NODE_ENV é substituído pelo bundler do consumidor (o modo lib do Vite não mexe nele);
// sem bundler, process não existe e o acesso lança erro
const isDev = (() => {
    try {
        return process.env.NODE_ENV !== 'production';
    } catch {
        return false;
    }
})();

// Escopo de módulo: avisa uma vez por carregamento do módulo, não por instância
let warnedSecondColor = false;

export interface SimpleArcProps {
    /** Progresso entre 0 e 1 */
    value: number;
    width?: string;
    fullCircle?: boolean;
    thickness?: number;
    /** Espessura da trilha; padrão thickness / 5 */
    trackThickness?: number;
    color?: string;
    trackColor?: string;
    /** @deprecated use trackColor */
    secondColor?: string;
}
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// Declaração em runtime: o build de produção remove type/required de props declaradas só por tipo
const props = defineProps({
    value: { type: Number, required: true },
    width: { type: String, default: '100%' },
    fullCircle: { type: Boolean, default: false },
    thickness: { type: Number, default: 8 },
    trackThickness: { type: Number as PropType<number | undefined>, default: undefined },
    color: { type: String, default: '#41b883' },
    trackColor: { type: String as PropType<string | undefined>, default: undefined },
    secondColor: { type: String as PropType<string | undefined>, default: undefined }
});

// Largura usada no SSR e antes da medição; depois do mount, 1 unidade do viewBox = 1px
const FALLBACK_SIZE = 200;
// pathLength normalizado: o progresso não depende do tamanho, então resize não anima
const DASH = 100;

if (isDev && props.secondColor !== undefined && !warnedSecondColor) {
    warnedSecondColor = true;
    console.warn('[vue-simple-arc] a prop "secondColor" está obsoleta; use "trackColor".');
}

const container = ref<HTMLDivElement>();
const size = ref(FALLBACK_SIZE);
const reducedMotion = ref(false);

// Valor limitado a 0..1; NaN/Infinity viram 0
const ratio = computed(() => Number.isFinite(props.value) ? Math.min(1, Math.max(0, props.value)) : 0);

const resolvedTrackThickness = computed(() => props.trackThickness ?? props.thickness / 5);
const resolvedTrackColor = computed(() => props.trackColor ?? props.secondColor ?? '#80808040');

// Linha mais grossa define o recuo, para nenhuma das duas ser cortada na borda
const stroke = computed(() => Math.max(props.thickness, resolvedTrackThickness.value));
const height = computed(() => props.fullCircle ? size.value : size.value / 2 + stroke.value / 2);

// Da esquerda no sentido horário; o círculo são dois meios arcos (um arco com extremos iguais não é desenhado)
const arcPath = computed(() => {
    const center = round(size.value / 2);
    const radius = round(Math.max(0, center - stroke.value / 2));
    const left = `${round(center - radius)} ${center}`;
    const right = `${round(center + radius)} ${center}`;
    const half = (to: string) => `A ${radius} ${radius} 0 0 1 ${to}`;
    return props.fullCircle ? `M ${left} ${half(right)} ${half(left)}` : `M ${left} ${half(right)}`;
});

function round(n: number) {
    return Math.round(n * 1000) / 1000;
}

// Ao chegar em 0, esconde o ponto do linecap só depois que o arco terminou de recolher
const transition = computed(() => {
    if (reducedMotion.value) return 'none';
    const duration = 'var(--simple-arc-duration, 0.4s)';
    const dash = `stroke-dashoffset ${duration} var(--simple-arc-easing, ease)`;
    return ratio.value > 0 ? dash : `${dash}, stroke-opacity 0s linear ${duration}`;
});

const slotStyle = computed(() => ({
    position: 'absolute' as const,
    right: '50%',
    bottom: props.fullCircle ? '50%' : 0,
    transform: props.fullCircle ? 'translateX(50%) translateY(50%)' : 'translateX(50%)'
}));

// Container oculto (display: none) mede 0; mantém a última largura válida
function measure() {
    const width = container.value?.clientWidth ?? 0;
    if (width > 0) size.value = width;
}

let observer: ResizeObserver | undefined;
onMounted(() => {
    measure();
    reducedMotion.value = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    if (typeof ResizeObserver === 'undefined' || !container.value) return;
    observer = new ResizeObserver(measure);
    observer.observe(container.value);
});

onUnmounted(() => observer?.disconnect());
</script>
