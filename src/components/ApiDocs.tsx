import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronRight, Book, Database, Mail, Shield, ExternalLink, Play, Download, Check, Loader } from 'lucide-react';
import outputs from '../../amplify_outputs.json';

const APPSYNC_URL = (outputs as any).data?.url || '';
const API_KEY = (outputs as any).data?.api_key || '';
const LOPD_BASE_URL = 'https://0sikyas0mf.execute-api.us-east-1.amazonaws.com/v1';
const LOPD_API_KEY = '6FWGvXEkV38x9nuqGDayV6bfxZBe7Zvc997JO5hn';

/* ════════════════════════════════════════════
   Endpoint definitions
   ════════════════════════════════════════════ */
interface EndpointDef {
  id: string;
  method: string;
  label: string;
  description: string;
  color: string;
  type: 'graphql' | 'rest';
  url: string;
  defaultBody: string;
  headers: Record<string, string>;
}

const gqlHeaders = { 'Content-Type': 'application/json', 'x-api-key': API_KEY };
const lopdHeaders = { 'Content-Type': 'application/json', 'x-api-key': LOPD_API_KEY };

const ENDPOINTS: { section: string; icon: string; color: string; subtitle: string; items: EndpointDef[] }[] = [
  {
    section: 'Proceso', icon: 'database', color: '#6366f1', subtitle: 'CRUD — GraphQL (AppSync)',
    items: [
      {
        id: 'listProcesos', method: 'QUERY', label: 'listProcesos', description: 'Listar todos los procesos', color: '#10b981', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `query ListProcesos {\n  listProcesos {\n    items {\n      id\n      nombre\n      descripcion\n      tituloLanding\n      encabezadoLanding\n      createdAt\n      updatedAt\n    }\n  }\n}` }, null, 2)
      },
      {
        id: 'getProceso', method: 'QUERY', label: 'getProceso', description: 'Obtener proceso por ID', color: '#10b981', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `query GetProceso($id: ID!) {\n  getProceso(id: $id) {\n    id\n    nombre\n    descripcion\n    tituloLanding\n    encabezadoLanding\n    createdAt\n    updatedAt\n    plantillasAsociadas {\n      items {\n        id\n        procesoId\n        plantillaId\n        plantilla {\n          id\n          nombre\n          codigo\n          version\n          url\n          contenido\n          requiereAceptacion\n          solicitarAceptacion\n          eliminada\n          createdAt\n          updatedAt\n        }\n      }\n    }\n  }\n}`, variables: { id: "<ID_AQUI>" } }, null, 2)
      },
      {
        id: 'createProceso', method: 'MUTATION', label: 'createProceso', description: 'Crear nuevo proceso', color: '#f59e0b', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `mutation CreateProceso($input: CreateProcesoInput!) {\n  createProceso(input: $input) {\n    id\n    nombre\n    descripcion\n  }\n}`, variables: { input: { nombre: "Proceso Nuevo", descripcion: "Descripción", tituloLanding: "Título", encabezadoLanding: "Encabezado" } } }, null, 2)
      },
      {
        id: 'updateProceso', method: 'MUTATION', label: 'updateProceso', description: 'Actualizar proceso', color: '#f59e0b', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `mutation UpdateProceso($input: UpdateProcesoInput!) {\n  updateProceso(input: $input) {\n    id\n    nombre\n    descripcion\n  }\n}`, variables: { input: { id: "<ID_AQUI>", nombre: "Nombre Actualizado" } } }, null, 2)
      },
      {
        id: 'deleteProceso', method: 'MUTATION', label: 'deleteProceso', description: 'Eliminar proceso', color: '#ef4444', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `mutation DeleteProceso($input: DeleteProcesoInput!) {\n  deleteProceso(input: $input) {\n    id\n  }\n}`, variables: { input: { id: "<ID_AQUI>" } } }, null, 2)
      },
    ]
  },
  {
    section: 'Plantilla', icon: 'file', color: '#3b82f6', subtitle: 'CRUD — GraphQL (AppSync)',
    items: [
      {
        id: 'listPlantillas', method: 'QUERY', label: 'listPlantillas', description: 'Listar todas las plantillas', color: '#10b981', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `query ListPlantillas {\n  listPlantillas {\n    items {\n      id\n      nombre\n      codigo\n      version\n      url\n      contenido\n      requiereAceptacion\n      solicitarAceptacion\n      eliminada\n      createdAt\n      updatedAt\n    }\n  }\n}` }, null, 2)
      },
      {
        id: 'getPlantilla', method: 'QUERY', label: 'getPlantilla', description: 'Consultar plantilla por ID', color: '#10b981', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `query GetPlantilla($id: ID!) {\n  getPlantilla(id: $id) {\n    id\n    nombre\n    codigo\n    version\n    url\n    contenido\n    requiereAceptacion\n    solicitarAceptacion\n    eliminada\n    createdAt\n    updatedAt\n    procesosAsociados {\n      items {\n        id\n        procesoId\n        plantillaId\n        proceso {\n          id\n          nombre\n          descripcion\n        }\n      }\n    }\n  }\n}`, variables: { id: "<ID_AQUI>" } }, null, 2)
      },
      {
        id: 'createPlantilla', method: 'MUTATION', label: 'createPlantilla', description: 'Crear nueva plantilla', color: '#f59e0b', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `mutation CreatePlantilla($input: CreatePlantillaInput!) {\n  createPlantilla(input: $input) {\n    id\n    nombre\n    codigo\n    version\n  }\n}`, variables: { input: { nombre: "Nueva Plantilla", codigo: "NP-001", version: "1.0", contenido: "<p>Contenido HTML</p>", requiereAceptacion: true, solicitarAceptacion: false } } }, null, 2)
      },
      {
        id: 'updatePlantilla', method: 'MUTATION', label: 'updatePlantilla', description: 'Actualizar plantilla', color: '#f59e0b', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `mutation UpdatePlantilla($input: UpdatePlantillaInput!) {\n  updatePlantilla(input: $input) {\n    id\n    nombre\n    codigo\n  }\n}`, variables: { input: { id: "<ID_AQUI>", nombre: "Nombre Actualizado", version: "2.0" } } }, null, 2)
      },
      {
        id: 'deletePlantilla', method: 'MUTATION', label: 'deletePlantilla', description: 'Eliminar plantilla', color: '#ef4444', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `mutation DeletePlantilla($input: DeletePlantillaInput!) {\n  deletePlantilla(input: $input) {\n    id\n  }\n}`, variables: { input: { id: "<ID_AQUI>" } } }, null, 2)
      },
    ]
  },
  {
    section: 'Asociaciones', icon: 'link', color: '#f97316', subtitle: 'ProcesoPlantilla — GraphQL (AppSync)',
    items: [
      {
        id: 'listProcesoPlantillas', method: 'QUERY', label: 'listProcesoPlantillas', description: 'Listar asociaciones proceso-plantilla', color: '#10b981', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `query ListProcesoPlantillas {
  listProcesoPlantillas {
    items {
      id
      procesoId
      plantillaId
      proceso {
        id
        nombre
      }
      plantilla {
        id
        nombre
        codigo
      }
    }
  }
}` }, null, 2)
      },
      {
        id: 'createProcesoPlantilla', method: 'MUTATION', label: 'createProcesoPlantilla', description: 'Asociar plantilla a proceso', color: '#f59e0b', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `mutation CreateProcesoPlantilla($input: CreateProcesoPlantillaInput!) {
  createProcesoPlantilla(input: $input) {
    id
    procesoId
    plantillaId
  }
}`, variables: { input: { procesoId: "<PROCESO_ID>", plantillaId: "<PLANTILLA_ID>" } } }, null, 2)
      },
      {
        id: 'deleteProcesoPlantilla', method: 'MUTATION', label: 'deleteProcesoPlantilla', description: 'Desasociar plantilla de proceso', color: '#ef4444', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `mutation DeleteProcesoPlantilla($input: DeleteProcesoPlantillaInput!) {
  deleteProcesoPlantilla(input: $input) {
    id
  }
}`, variables: { input: { id: "<ID_ASOCIACION>" } } }, null, 2)
      },
    ]
  },
  {
    section: 'sendEmail', icon: 'mail', color: '#10b981', subtitle: 'Mutación — GraphQL + Lambda',
    items: [
      {
        id: 'sendEmail', method: 'MUTATION', label: 'sendEmail', description: 'Enviar correo vía SES', color: '#f59e0b', type: 'graphql', url: APPSYNC_URL, headers: gqlHeaders,
        defaultBody: JSON.stringify({ query: `mutation SendEmail($to: String!, $subject: String!, $body: String!) {\n  sendEmail(to: $to, subject: $subject, body: $body)\n}`, variables: { to: "cliente@example.com", subject: "Documentos pendientes", body: "<h1>Hola</h1><p>Tienes documentos por firmar.</p>" } }, null, 2)
      },
    ]
  },
  {
    section: 'LOPD Transacciones', icon: 'external', color: '#ec4899', subtitle: 'API REST externa',
    items: [
      {
        id: 'lopdCreate', method: 'POST', label: '/rest/faceid/lopd/create', description: 'Crear transacción LOPD', color: '#3b82f6', type: 'rest', url: `${LOPD_BASE_URL}/rest/faceid/lopd/create`, headers: lopdHeaders,
        defaultBody: JSON.stringify({ cedula: "0912345678", ip: "192.168.1.1", nombres: "Juan", apellidoPaterno: "Pérez", apellidoMaterno: "López", correo: "juan@example.com", telefono: "0991234567", channel: "WEB", flujoProceso: "Portal LOPDP", communicationChannel: "wsp", storeId: "STORE-001", proceso: ["proceso-id-1"], plantillas: ["plantilla-id-1"] }, null, 2)
      },
      {
        id: 'lopdGet', method: 'POST', label: '/rest/faceid/lopd/get', description: 'Obtener transacciones', color: '#10b981', type: 'rest', url: `${LOPD_BASE_URL}/rest/faceid/lopd/get`, headers: lopdHeaders,
        defaultBody: JSON.stringify({}, null, 2)
      },
      {
        id: 'lopdUpdate', method: 'POST', label: '/rest/faceid/lopd/update?id=<ID>', description: 'Actualizar transacción', color: '#f59e0b', type: 'rest', url: `${LOPD_BASE_URL}/rest/faceid/lopd/update?id=<ID_AQUI>`, headers: lopdHeaders,
        defaultBody: JSON.stringify({ estado: "procesado" }, null, 2)
      },
    ]
  }
];

/* ════════════════════════════════════════════
   Postman Collection Generator
   ════════════════════════════════════════════ */
function generatePostmanCollection() {
  // const items = ENDPOINTS.flatMap(section =>
  //   section.items.map(ep => ({
  //     name: `${ep.method} ${ep.label}`,
  //     request: {
  //       method: 'POST',
  //       header: Object.entries(ep.headers).map(([key, value]) => ({ key, value, type: 'text' })),
  //       body: { mode: 'raw', raw: ep.defaultBody, options: { raw: { language: 'json' } } },
  //       url: { raw: ep.url, protocol: 'https', host: [ep.url.replace('https://', '').split('/')[0]], path: ep.url.replace('https://', '').split('/').slice(1) }
  //     }
  //   }))
  // );

  const collection = {
    info: { name: 'Plantillas API', description: 'Colección auto-generada — GraphQL (AppSync) + LOPD REST', schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
    item: ENDPOINTS.map(section => ({
      name: section.section,
      item: section.items.map(ep => ({
        name: `${ep.method} ${ep.label}`,
        request: {
          method: 'POST',
          header: Object.entries(ep.headers).map(([key, value]) => ({ key, value, type: 'text' as const })),
          body: { mode: 'raw' as const, raw: ep.defaultBody, options: { raw: { language: 'json' } } },
          url: { raw: ep.url }
        }
      }))
    }))
  };

  const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Plantillas_API.postman_collection.json';
  a.click();
  URL.revokeObjectURL(url);
}

/* ════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════ */
const MethodBadge: React.FC<{ method: string; color: string }> = ({ method, color }) => (
  <span style={{
    background: color, color: '#fff', fontWeight: 700, fontSize: '0.7rem',
    padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.05em',
    fontFamily: 'monospace', minWidth: 72, textAlign: 'center', display: 'inline-block'
  }}>{method}</span>
);

const EndpointCard: React.FC<{ ep: EndpointDef }> = ({ ep }) => {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(ep.defaultBody);
  const [urlOverride, setUrlOverride] = useState(ep.url);
  const [response, setResponse] = useState<string | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const execute = async () => {
    setLoading(true); setResponse(null); setStatus(null); setElapsed(null);
    const t0 = performance.now();
    try {
      const res = await fetch(urlOverride, { method: 'POST', headers: ep.headers, body });
      const elapsed = Math.round(performance.now() - t0);
      setElapsed(elapsed);
      setStatus(res.status);
      const text = await res.text();
      try { setResponse(JSON.stringify(JSON.parse(text), null, 2)); }
      catch { setResponse(text); }
    } catch (err: any) {
      setElapsed(Math.round(performance.now() - t0));
      setStatus(0);
      setResponse(`Error: ${err.message}`);
    }
    setLoading(false);
  };

  const copyResponse = () => {
    if (response) { navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  };

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', borderLeft: `4px solid ${ep.color}`, marginBottom: 12, transition: 'box-shadow 0.2s' }}>
      {/* Header row */}
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer',
        background: open ? 'rgba(99,102,241,0.03)' : 'var(--bg-secondary)', transition: 'background 0.15s'
      }}>
        {open ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
        <MethodBadge method={ep.method} color={ep.color} />
        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{ep.label}</span>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{ep.description}</span>
      </div>

      {/* Expanded panel */}
      {open && (
        <div style={{ padding: '18px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)' }}>
          {/* URL */}
          <label style={labelStyle}>URL</label>
          <input value={urlOverride} onChange={e => setUrlOverride(e.target.value)}
            style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: 14 }} />

          {/* Request body */}
          <label style={labelStyle}>Request Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={12}
            style={{ ...inputStyle, fontFamily: "'Fira Code','Consolas',monospace", fontSize: '0.78rem', lineHeight: 1.6, resize: 'vertical', minHeight: 120 }} />

          {/* Execute button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <button onClick={execute} disabled={loading} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px',
              background: loading ? '#64748b' : 'linear-gradient(135deg, var(--accent), #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: loading ? 'wait' : 'pointer',
              fontWeight: 600, fontSize: '0.88rem', transition: 'all 0.2s'
            }}>
              {loading ? <Loader size={16} className="spin" /> : <Play size={16} />}
              {loading ? 'Ejecutando...' : 'Ejecutar'}
            </button>
            <button onClick={() => { setBody(ep.defaultBody); setUrlOverride(ep.url); }} style={{
              padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)'
            }}>Reset</button>
          </div>

          {/* Response */}
          {response !== null && (
            <div style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ ...labelStyle, margin: 0 }}>Response</label>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                    background: status && status >= 200 && status < 300 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: status && status >= 200 && status < 300 ? '#10b981' : '#ef4444'
                  }}>
                    {status === 0 ? 'ERROR' : `${status}`}
                  </span>
                  {elapsed !== null && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{elapsed}ms</span>
                  )}
                </div>
                <button onClick={copyResponse} style={{
                  display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text-muted)'
                }}>
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <pre style={{
                background: '#1e293b', color: '#e2e8f0', padding: 16, borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem', lineHeight: 1.6, overflowX: 'auto', maxHeight: 400, margin: 0,
                fontFamily: "'Fira Code','Consolas',monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word'
              }}>{response}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
  color: 'var(--text-muted)', marginBottom: 6, display: 'block'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)', outline: 'none'
};

const SectionIcon: React.FC<{ type: string; color: string }> = ({ type, color }) => {
  const props = { size: 20, color };
  if (type === 'mail') return <Mail {...props} />;
  if (type === 'external') return <ExternalLink {...props} />;
  return <Database {...props} />;
};

/* ════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════ */
export const ApiDocs: React.FC = () => {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--space-xl)' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', padding: '10px 24px', borderRadius: 'var(--radius-xl)', marginBottom: 16 }}>
          <Book size={20} color="#fff" />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.04em' }}>API DOCUMENTATION</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Plantillas API v1</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 600, margin: '0 auto 24px' }}>
          Documentación interactiva — Ejecuta peticiones en vivo o exporta la colección para Postman.
        </p>
        <button onClick={generatePostmanCollection} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
          background: '#FF6C37', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', transition: 'transform 0.2s, box-shadow 0.2s',
          boxShadow: '0 4px 15px rgba(255,108,55,0.3)'
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Download size={18} /> Exportar Colección Postman
        </button>
      </div>

      {/* Connection Info */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 32 }}>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} /> Conexión & Autenticación
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GraphQL Endpoint</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent)', wordBreak: 'break-all', marginTop: 4 }}>{APPSYNC_URL}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>API Key (AppSync)</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>{API_KEY}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LOPD REST Endpoint</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent)', wordBreak: 'break-all', marginTop: 4 }}>{LOPD_BASE_URL}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>API Key (LOPD)</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>{LOPD_API_KEY}</div>
          </div>
        </div>
      </div>

      {/* Endpoint sections */}
      {ENDPOINTS.map(section => (
        <div key={section.section}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, marginTop: 36 }}>
            <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: `${section.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SectionIcon type={section.icon} color={section.color} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>{section.section}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{section.subtitle}</p>
            </div>
          </div>
          {section.items.map(ep => <EndpointCard key={ep.id} ep={ep} />)}
        </div>
      ))}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px 0', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 40 }}>
        Plantillas API Documentation — Generado desde el esquema Amplify Gen 2
      </div>
    </div>
  );
};
