<script lang="ts">
  export let group: 'D4' = 'D4';
  export let highlight: 'subgroup' | 'none' = 'subgroup';

  type Point = { id: number; label: string; x: number; y: number; rotation: boolean };

  let showSubgroup = highlight === 'subgroup';
  let dragging: number | null = null;
  let svg: SVGSVGElement;
  let points: Point[] = [
    { id: 0, label: 'e', x: 200, y: 40, rotation: true },
    { id: 1, label: 'r', x: 310, y: 85, rotation: true },
    { id: 2, label: 'r²', x: 355, y: 195, rotation: true },
    { id: 3, label: 'r³', x: 310, y: 305, rotation: true },
    { id: 4, label: 's', x: 200, y: 350, rotation: false },
    { id: 5, label: 'sr', x: 90, y: 305, rotation: false },
    { id: 6, label: 'sr²', x: 45, y: 195, rotation: false },
    { id: 7, label: 'sr³', x: 90, y: 85, rotation: false },
  ];

  const rotationEdges = points.map((point) => [point.id, point.id < 4 ? (point.id + 1) % 4 : 4 + ((point.id - 3) % 4)]);
  const reflectionEdges = [[0, 4], [1, 7], [2, 6], [3, 5]];

  function position(event: PointerEvent) {
    const box = svg.getBoundingClientRect();
    return {
      x: (event.clientX - box.left) * (400 / box.width),
      y: (event.clientY - box.top) * (400 / box.height),
    };
  }

  function startDrag(event: PointerEvent, id: number) {
    dragging = id;
    (event.currentTarget as SVGElement).setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent) {
    if (dragging === null) return;
    const next = position(event);
    points = points.map((point) => point.id === dragging
      ? { ...point, x: Math.max(24, Math.min(376, next.x)), y: Math.max(24, Math.min(376, next.y)) }
      : point);
  }

  function stopDrag() {
    dragging = null;
  }
</script>

<section class="cayley" aria-label="Interactive Cayley graph of the dihedral group D4">
  <div class="cayley__heading">
    <strong>Cayley graph of {group}</strong>
    <button type="button" aria-pressed={showSubgroup} on:click={() => showSubgroup = !showSubgroup}>
      {showSubgroup ? 'hide' : 'show'} rotations ⟨r⟩
    </button>
  </div>
  <svg bind:this={svg} viewBox="0 0 400 400" role="img" aria-labelledby="cayley-title" on:pointermove={move} on:pointerup={stopDrag} on:pointercancel={stopDrag}>
    <title id="cayley-title">The eight elements of D4 connected by rotation and reflection generators</title>
    {#each rotationEdges as edge}
      <line class="edge edge--rotation" x1={points[edge[0]].x} y1={points[edge[0]].y} x2={points[edge[1]].x} y2={points[edge[1]].y} />
    {/each}
    {#each reflectionEdges as edge}
      <line class="edge edge--reflection" x1={points[edge[0]].x} y1={points[edge[0]].y} x2={points[edge[1]].x} y2={points[edge[1]].y} />
    {/each}
    {#each points as point}
      <g
        class:highlighted={showSubgroup && point.rotation}
        class="node"
        role="button"
        tabindex="0"
        aria-label={`Element ${point.label}; drag to move`}
        transform={`translate(${point.x} ${point.y})`}
        on:pointerdown={(event) => startDrag(event, point.id)}
      >
        <circle r="22" />
        <text text-anchor="middle" dominant-baseline="central">{point.label}</text>
      </g>
    {/each}
  </svg>
  <p><span class="key key--r"></span> multiply by r <span class="key key--s"></span> multiply by s</p>
</section>

<style>
  .cayley {
    margin-block: 2rem;
    padding: 1rem;
    border: 1px solid rgb(87 104 148 / 0.25);
    border-radius: 0.4rem;
    background: rgb(255 255 255 / 0.35);
  }

  .cayley__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.8em;
  }

  button {
    padding: 0.45em 0.7em;
    border: 1px solid #948357;
    border-radius: 999px;
    color: #171717;
    background: #fff9ef;
    font: inherit;
    cursor: pointer;
  }

  button:hover,
  button:focus-visible {
    border-color: #4a90e2;
  }

  svg {
    width: 100%;
    height: auto;
    touch-action: none;
    user-select: none;
  }

  .edge {
    stroke-width: 3;
  }

  .edge--rotation { stroke: #948357; }
  .edge--reflection { stroke: #576894; stroke-dasharray: 7 6; }

  .node { cursor: grab; }
  .node:active { cursor: grabbing; }
  .node circle { fill: #fff9ef; stroke: #576894; stroke-width: 3; }
  .node text { fill: #171717; font: 17px 'Libre Baskerville', serif; pointer-events: none; }
  .node.highlighted circle { fill: #d7c186; stroke: #948357; }

  p {
    margin: 0;
    font-size: 0.7em;
    text-align: center;
  }

  .key {
    display: inline-block;
    width: 1.5em;
    margin-inline: 0.6em 0.25em;
    border-top: 3px solid;
    vertical-align: middle;
  }

  .key--r { color: #948357; }
  .key--s { color: #576894; border-top-style: dashed; }

  @media (max-width: 32rem) {
    .cayley__heading { align-items: flex-start; flex-direction: column; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { transition: none !important; animation: none !important; }
  }
</style>
