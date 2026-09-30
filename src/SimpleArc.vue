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
        <svg ref="svgRef" width="100%" :height="height" style="display: block"></svg>
        <div class="slot" :style="slotStyle"><slot></slot></div>
    </div>
</template>
  
<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
const svgWidth = ref()
const height = ref()
const container = ref()

const svgRef = ref<SVGElement>();

const startAngle = 0

const props = defineProps({
    width: {
        type: String,
        required: false,
        default: '100%'
    },
    value: {
        type: Number,
        required: true
    },
    fullCircle: {
        type: Boolean,
        required: false,
        default: false
    },
    thickness: {
        type: Number,
        required: false,
        default: 8
    },
    color: {
        type: String,
        required: false,
        default: '#41b883'
    },
    secondColor: {
        type: String,
        required: false,
        default: '#80808040'
    }
});

// Valor limitado a 0..1; NaN/Infinity viram 0
const ratio = computed(() => Number.isFinite(props.value) ? Math.min(1, Math.max(0, props.value)) : 0);

const slotStyle = computed(() => ({
    position: 'absolute' as const,
    right: '50%',
    bottom: props.fullCircle ? '50%' : 0,
    transform: props.fullCircle ? 'translateX(50%) translateY(50%)' : 'translateX(50%)'
}));

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - (180 - startAngle)) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
}

function updateArc() {

    if (!container.value) return;
    svgWidth.value = container.value.clientWidth
    height.value = svgWidth.value / 2 + props.thickness/2
    const degree = props.fullCircle ? ratio.value * 360 : ratio.value * 180;

    if (props.fullCircle) {
        height.value = svgWidth.value
    }

    const mainPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    mainPath.setAttribute("d", describeArc(svgWidth.value/2 , svgWidth.value /2, svgWidth.value/2 -props.thickness/2, 0, Math.min(359.99,degree)));
    mainPath.setAttribute("fill", "none");
    mainPath.setAttribute("stroke", props.color);
    mainPath.setAttribute("stroke-width", props.thickness.toString());
    mainPath.setAttribute("stroke-linecap", "round");
    
    const secondaryArcSize = props.fullCircle ? 360 : 180
    const secondaryPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    secondaryPath.setAttribute("d", describeArc(svgWidth.value/2 , svgWidth.value /2, svgWidth.value/2 -props.thickness/2, 0, Math.min(359.99,secondaryArcSize)));
    secondaryPath.setAttribute("fill", "none");
    secondaryPath.setAttribute("stroke", props.secondColor);
    secondaryPath.setAttribute("stroke-width", (props.thickness/5).toString());
    secondaryPath.setAttribute("stroke-linecap", "round");

    if (svgRef.value) {
        svgRef.value.innerHTML = '';
        svgRef.value.appendChild(secondaryPath);
        // Em 0 o linecap arredondado desenharia um ponto
        if (ratio.value > 0) {
            svgRef.value.appendChild(mainPath);
        }
    }
}
let frame = 0;
function scheduleUpdate() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(updateArc);
}

let observer: ResizeObserver | undefined;
onMounted(() => {
    updateArc();
    if (typeof ResizeObserver === 'undefined') return;
    observer = new ResizeObserver(scheduleUpdate);
    if (container.value) {
        observer.observe(container.value);
    }
});

onUnmounted(() => {
    observer?.disconnect();
    cancelAnimationFrame(frame);
});

watch(() => [ ratio.value, props.fullCircle, props.thickness, props.color, props.secondColor ], updateArc);

</script>
