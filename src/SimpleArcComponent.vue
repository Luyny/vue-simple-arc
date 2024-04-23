<template>
    <div id="container" ref="container" :style="{width: props.width}">
        <svg ref="svgRef" width="100%" :height="height"></svg>
        <div class="slot" :class="{'full':fullCircle}"><slot></slot></div>
    </div>
</template>
  
<script setup lang="ts">
import { ref, watch, onMounted, defineProps, onUnmounted } from 'vue';
// @ts-expect-error any-type
import { debounce } from 'lodash';
// Define the props
const width = ref()
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
        default: '#00000033'
    }
});

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
    width.value = container.value.clientWidth
    height.value = width.value / 2 + props.thickness/2
    const degree = props.fullCircle ? props.value * 360 : props.value * 180;

    if (props.fullCircle) {
        height.value = width.value
    }

    const mainPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    mainPath.setAttribute("d", describeArc(width.value/2 , width.value /2, width.value/2 -props.thickness/2, 0, Math.min(359.99,degree)));
    mainPath.setAttribute("fill", "none");
    mainPath.setAttribute("stroke", props.color);
    mainPath.setAttribute("stroke-width", props.thickness.toString());
    mainPath.setAttribute("stroke-linecap", "round");
    
    const secondaryArcSize = props.fullCircle ? 360 : 180
    const secondaryPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    secondaryPath.setAttribute("d", describeArc(width.value/2 , width.value /2, width.value/2 -props.thickness/2, 0, Math.min(359.99,secondaryArcSize)));
    secondaryPath.setAttribute("fill", "none");
    secondaryPath.setAttribute("stroke", props.secondColor);
    secondaryPath.setAttribute("stroke-width", (props.thickness/5).toString());
    secondaryPath.setAttribute("stroke-linecap", "round");

    if (svgRef.value) {
        svgRef.value.innerHTML = '';
        svgRef.value.appendChild(secondaryPath);
        svgRef.value.appendChild(mainPath);
    }
}
onMounted(() => {
      const updateArcDebounced = debounce(updateArc, 50);
      const observer = new ResizeObserver(() => {
        updateArcDebounced();
      });

      if (container.value) {
        observer.observe(container.value);
      }

      onUnmounted(() => {
        observer.disconnect();
      });
    });

watch(() => [ props.value, props.fullCircle, props.thickness, props.color, props.secondColor, ], updateArc, { deep: true });

</script>

<style scoped lang="scss">
#container {
    position: relative;
    margin: 0;
    padding: 0;
    font-size: 0;

    .slot {
        font-size: 1rem;
        position: absolute;
        right: 50%;
        transform: translateX(50%);
        bottom: 0;

        &.full {
            bottom: 50%;
            transform: translateX(50%) translateY(50%);
        }
    }

}
</style>