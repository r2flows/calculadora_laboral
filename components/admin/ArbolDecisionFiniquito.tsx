"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { construirArbolFiniquito, type NodoArbol, type TipoNodo, type EdgeArbol } from "@/lib/arbolDecision/finiquito";

const ESTILO_TIPO: Record<TipoNodo, { badge: string; borde: string; label: string }> = {
  entrada: { badge: "bg-slate-100 text-slate-600 border-slate-300", borde: "border-slate-300", label: "Entrada" },
  calculo: { badge: "bg-blue-100 text-blue-700 border-blue-300", borde: "border-blue-300", label: "Cálculo" },
  decision: { badge: "bg-amber-100 text-amber-700 border-amber-300", borde: "border-amber-300", label: "Decisión" },
  total: { badge: "bg-green-100 text-green-700 border-green-400", borde: "border-green-400", label: "Total" },
};

interface NodoData extends NodoArbol {
  _dim: boolean;
  _activo: boolean;
}

function NodoArbolCard({ data }: NodeProps) {
  const nodo = data as unknown as NodoData;
  const estilo = ESTILO_TIPO[nodo.tipo];

  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-sm w-[300px] text-left transition-all duration-150 ${
        nodo._activo ? "border-blue-500 ring-2 ring-blue-300 shadow-md" : estilo.borde
      } ${nodo._dim ? "opacity-25 grayscale-[30%]" : "opacity-100"}`}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />

      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
        <span className="font-semibold text-sm text-gray-800 leading-tight">{nodo.titulo}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${estilo.badge} whitespace-nowrap`}>
          {estilo.label}
        </span>
      </div>

      {nodo.formula && (
        <p className="px-3 pt-2 text-xs text-gray-600 whitespace-pre-line leading-relaxed">{nodo.formula}</p>
      )}

      {nodo.valores && nodo.valores.length > 0 && (
        <div className="px-3 py-2 mt-1 bg-gray-50 border-t border-gray-100 space-y-0.5">
          {nodo.valores.map((v, i) => (
            <p key={i} className="text-[11px] text-gray-700 font-medium">{v}</p>
          ))}
        </div>
      )}

      {nodo.nota && (
        <p className="px-3 py-2 text-[11px] text-amber-800 bg-amber-50 border-t border-amber-100">
          ⚠️ {nodo.nota}
        </p>
      )}

      {nodo.fuente && (
        <p className="px-3 py-1.5 text-[10px] text-gray-400 border-t border-gray-100">{nodo.fuente}</p>
      )}
    </div>
  );
}

const nodeTypes = { arbolNode: NodoArbolCard };

/** Ancestros + descendientes transitivos + el propio nodo, a partir de las conexiones. */
function calcularRelacionados(id: string, edges: EdgeArbol[]): Set<string> {
  const hijos = new Map<string, string[]>();
  const padres = new Map<string, string[]>();
  for (const e of edges) {
    hijos.set(e.source, [...(hijos.get(e.source) ?? []), e.target]);
    padres.set(e.target, [...(padres.get(e.target) ?? []), e.source]);
  }

  const visitados = new Set<string>([id]);
  function recorrer(inicio: string, mapa: Map<string, string[]>) {
    const pila = [inicio];
    while (pila.length > 0) {
      const actual = pila.pop()!;
      for (const vecino of mapa.get(actual) ?? []) {
        if (!visitados.has(vecino)) {
          visitados.add(vecino);
          pila.push(vecino);
        }
      }
    }
  }
  recorrer(id, hijos);
  recorrer(id, padres);
  return visitados;
}

export default function ArbolDecisionFiniquito() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { nodosBase, edgesBase } = useMemo(() => {
    const { nodes, edges } = construirArbolFiniquito();
    return { nodosBase: nodes, edgesBase: edges };
  }, []);

  const relacionados = useMemo(
    () => (selectedId ? calcularRelacionados(selectedId, edgesBase) : null),
    [selectedId, edgesBase]
  );

  const nodes: Node[] = useMemo(
    () =>
      nodosBase.map((n) => ({
        id: n.id,
        type: "arbolNode",
        position: { x: n.x, y: n.y },
        data: {
          ...n,
          _dim: relacionados ? !relacionados.has(n.id) : false,
          _activo: n.id === selectedId,
        } as unknown as Record<string, unknown>,
      })),
    [nodosBase, relacionados, selectedId]
  );

  const edges: Edge[] = useMemo(
    () =>
      edgesBase.map((e) => {
        const enCamino = relacionados && relacionados.has(e.source) && relacionados.has(e.target);
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: "step",
          animated: Boolean(enCamino),
          style: {
            stroke: enCamino ? "#3b82f6" : "#cbd5e1",
            strokeWidth: enCamino ? 2.5 : 1,
            opacity: relacionados ? (enCamino ? 1 : 0.15) : 0.6,
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: enCamino ? "#3b82f6" : "#cbd5e1", width: 16, height: 16 },
        };
      }),
    [edgesBase, relacionados]
  );

  const tituloPorId = useMemo(
    () => new Map(nodosBase.map((n) => [n.id, n.titulo])),
    [nodosBase]
  );

  const [tooltipConexion, setTooltipConexion] = useState<{ texto: string; x: number; y: number } | null>(null);

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    setSelectedId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const onEdgeMouseEnter = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      const origen = tituloPorId.get(edge.source) ?? edge.source;
      const destino = tituloPorId.get(edge.target) ?? edge.target;
      setTooltipConexion({ texto: `"${origen}" → alimenta "${destino}"`, x: event.clientX, y: event.clientY });
    },
    [tituloPorId]
  );

  const onEdgeMouseMove = useCallback((event: React.MouseEvent) => {
    setTooltipConexion((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : prev));
  }, []);

  const onEdgeMouseLeave = useCallback(() => setTooltipConexion(null), []);

  return (
    <div className="h-full w-full relative">
      {selectedId && (
        <button
          onClick={() => setSelectedId(null)}
          className="absolute top-3 right-3 z-10 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50"
        >
          ✕ Limpiar selección
        </button>
      )}
      {!selectedId && (
        <p className="absolute top-3 right-3 z-10 bg-white/90 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-400 shadow-sm">
          Haz clic en un nodo para ver solo su camino
        </p>
      )}
      {tooltipConexion && (
        <div
          className="fixed z-50 pointer-events-none bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg max-w-xs"
          style={{ left: tooltipConexion.x + 14, top: tooltipConexion.y + 14 }}
        >
          {tooltipConexion.texto}
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedId(null)}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseMove={onEdgeMouseMove}
        onEdgeMouseLeave={onEdgeMouseLeave}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
