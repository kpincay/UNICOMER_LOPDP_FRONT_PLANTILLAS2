import React, { useState } from 'react';
import { Copy, ChevronDown, ChevronRight, Book, Database, Mail, Shield, ExternalLink } from 'lucide-react';
import outputs from '../../amplify_outputs.json';

const APPSYNC_URL = (outputs as any).data?.url || '';
const API_KEY = (outputs as any).data?.api_key || '';
const LOPD_BASE_URL = 'https://0sikyas0mf.execute-api.us-east-1.amazonaws.com/v1';
const LOPD_API_KEY = '6FWGvXEkV38x9nuqGDayV6bfxZBe7Zvc997JO5hn';

interface EndpointProps {
  method: string;
  label: string;
  description: string;
  request: string;
  response: string;
  headers?: Record<string, string>;
  color: string;
}

const MethodBadge: React.FC<{ method: string; color: string }> = ({ method, color }) => (
  <span style={{
    background: color, color: '#fff', fontWeight: 700, fontSize: '0.7rem',
    padding: '4px 10px', borderRadius: '4px', letterSpacing: '0.05em',
    fontFamily: 'monospace', minWidth: 72, textAlign: 'center', display: 'inline-block'
  }}>{method}</span>
);

const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      {lang && <div style={{ background: 'rgba(0,0,0,0.06)', padding: '4px 12px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', borderBottom: '1px solid var(--border-color)' }}>{lang}</div>}
      <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '16px', margin: 0, fontSize: '0.78rem', lineHeight: 1.6, overflowX: 'auto', fontFamily: "'Fira Code', 'Consolas', monospace" }}>{code}</pre>
      <button onClick={handleCopy} style={{
        position: 'absolute', top: lang ? 32 : 8, right: 8, background: 'rgba(255,255,255,0.1)',
        border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: '#94a3b8', fontSize: '0.7rem',
        display: 'flex', alignItems: 'center', gap: 4
      }}>
        <Copy size={12} /> {copied ? '¡Copiado!' : 'Copiar'}
      </button>
    </div>
  );
};

const EndpointCard: React.FC<EndpointProps> = ({ method, label, description, request, response, headers, color }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', borderLeft: `4px solid ${color}`, transition: 'box-shadow 0.2s', marginBottom: 12 }}>
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer',
        background: open ? 'rgba(99,102,241,0.03)' : 'var(--bg-secondary)',
        transition: 'background 0.15s'
      }}>
        {open ? <ChevronDown size={16} color="var(--text-muted)" /> : <ChevronRight size={16} color="var(--text-muted)" />}
        <MethodBadge method={method} color={color} />
        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{description}</span>
      </div>
      {open && (
        <div style={{ padding: '18px', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {headers && (
            <div>
              <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>Headers</h4>
              <CodeBlock code={Object.entries(headers).map(([k, v]) => `${k}: ${v}`).join('\n')} lang="headers" />
            </div>
          )}
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>Request</h4>
            <CodeBlock code={request} lang="graphql" />
          </div>
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '0.05em' }}>Response</h4>
            <CodeBlock code={response} lang="json" />
          </div>
        </div>
      )}
    </div>
  );
};

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; color: string }> = ({ icon, title, subtitle, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, marginTop: 32 }}>
    <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>
    </div>
  </div>
);

const gqlHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

const lopdHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-api-key': LOPD_API_KEY,
};

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
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: 600, margin: '0 auto' }}>
          Documentación de los recursos disponibles vía GraphQL (AppSync) y REST (LOPD).
        </p>
      </div>

      {/* Connection Info */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 32 }}>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} /> Conexión & Autenticación
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>GraphQL Endpoint</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)', wordBreak: 'break-all', marginTop: 4 }}>{APPSYNC_URL}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>API Key (AppSync)</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{API_KEY}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>LOPD REST Endpoint</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--accent)', wordBreak: 'break-all', marginTop: 4 }}>{LOPD_BASE_URL}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>API Key (LOPD)</span>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>{LOPD_API_KEY}</div>
          </div>
        </div>
      </div>

      {/* ═══ PROCESO ═══ */}
      <SectionTitle icon={<Database size={20} color="#6366f1" />} title="Proceso" subtitle="CRUD para procesos de negocio — GraphQL (AppSync)" color="#6366f1" />

      <EndpointCard method="QUERY" label="listProcesos" description="Listar todos los procesos" color="#10b981"
        headers={gqlHeaders}
        request={`POST ${APPSYNC_URL}\n\n{\n  "query": "query ListProcesos { listProcesos { items { id nombre descripcion tituloLanding encabezadoLanding createdAt updatedAt } } }"\n}`}
        response={`{\n  "data": {\n    "listProcesos": {\n      "items": [\n        {\n          "id": "abc-123",\n          "nombre": "Proceso de Crédito",\n          "descripcion": "Flujo para aprobación de crédito",\n          "tituloLanding": "Bienvenido",\n          "encabezadoLanding": "Complete sus datos",\n          "createdAt": "2025-01-15T10:00:00Z",\n          "updatedAt": "2025-01-15T10:00:00Z"\n        }\n      ]\n    }\n  }\n}`}
      />

      <EndpointCard method="QUERY" label="getProceso" description="Obtener un proceso por ID" color="#10b981"
        headers={gqlHeaders}
        request={`POST ${APPSYNC_URL}\n\n{\n  "query": "query GetProceso($id: ID!) { getProceso(id: $id) { id nombre descripcion tituloLanding encabezadoLanding createdAt updatedAt } }",\n  "variables": { "id": "abc-123" }\n}`}
        response={`{\n  "data": {\n    "getProceso": {\n      "id": "abc-123",\n      "nombre": "Proceso de Crédito",\n      "descripcion": "Flujo para aprobación",\n      "tituloLanding": "Bienvenido",\n      "encabezadoLanding": "Complete sus datos",\n      "createdAt": "2025-01-15T10:00:00Z",\n      "updatedAt": "2025-01-15T10:00:00Z"\n    }\n  }\n}`}
      />

      <EndpointCard method="MUTATION" label="createProceso" description="Crear un nuevo proceso" color="#f59e0b"
        headers={gqlHeaders}
        request={`POST ${APPSYNC_URL}\n\n{\n  "query": "mutation CreateProceso($input: CreateProcesoInput!) { createProceso(input: $input) { id nombre descripcion } }",\n  "variables": {\n    "input": {\n      "nombre": "Proceso Nuevo",\n      "descripcion": "Descripción del proceso",\n      "tituloLanding": "Título",\n      "encabezadoLanding": "Encabezado"\n    }\n  }\n}`}
        response={`{\n  "data": {\n    "createProceso": {\n      "id": "new-id-456",\n      "nombre": "Proceso Nuevo",\n      "descripcion": "Descripción del proceso"\n    }\n  }\n}`}
      />

      <EndpointCard method="MUTATION" label="updateProceso" description="Actualizar un proceso existente" color="#f59e0b"
        headers={gqlHeaders}
        request={`POST ${APPSYNC_URL}\n\n{\n  "query": "mutation UpdateProceso($input: UpdateProcesoInput!) { updateProceso(input: $input) { id nombre descripcion } }",\n  "variables": {\n    "input": {\n      "id": "abc-123",\n      "nombre": "Nombre Actualizado"\n    }\n  }\n}`}
        response={`{\n  "data": {\n    "updateProceso": {\n      "id": "abc-123",\n      "nombre": "Nombre Actualizado",\n      "descripcion": "Descripción original"\n    }\n  }\n}`}
      />

      <EndpointCard method="MUTATION" label="deleteProceso" description="Eliminar un proceso por ID" color="#ef4444"
        headers={gqlHeaders}
        request={`POST ${APPSYNC_URL}\n\n{\n  "query": "mutation DeleteProceso($input: DeleteProcesoInput!) { deleteProceso(input: $input) { id } }",\n  "variables": { "input": { "id": "abc-123" } }\n}`}
        response={`{\n  "data": {\n    "deleteProceso": {\n      "id": "abc-123"\n    }\n  }\n}`}
      />

      {/* ═══ PLANTILLA ═══ */}
      <SectionTitle icon={<Database size={20} color="#3b82f6" />} title="Plantilla" subtitle="CRUD para plantillas de documentos — GraphQL (AppSync)" color="#3b82f6" />

      <EndpointCard method="QUERY" label="listPlantillas" description="Listar todas las plantillas" color="#10b981"
        headers={gqlHeaders}
        request={`POST ${APPSYNC_URL}\n\n{\n  "query": "query ListPlantillas { listPlantillas { items { id nombre codigo version url contenido requiereAceptacion solicitarAceptacion procesoId createdAt updatedAt } } }"\n}`}
        response={`{\n  "data": {\n    "listPlantillas": {\n      "items": [\n        {\n          "id": "plt-001",\n          "nombre": "Consentimiento Informado",\n          "codigo": "CI-001",\n          "version": "1.0",\n          "url": "https://...",\n          "contenido": "<p>Texto del documento...</p>",\n          "requiereAceptacion": true,\n          "solicitarAceptacion": true,\n          "procesoId": "abc-123",\n          "createdAt": "2025-01-15T10:00:00Z",\n          "updatedAt": "2025-01-15T10:00:00Z"\n        }\n      ]\n    }\n  }\n}`}
      />

      <EndpointCard method="MUTATION" label="createPlantilla" description="Crear una nueva plantilla" color="#f59e0b"
        headers={gqlHeaders}
        request={`POST ${APPSYNC_URL}\n\n{\n  "query": "mutation CreatePlantilla($input: CreatePlantillaInput!) { createPlantilla(input: $input) { id nombre codigo version } }",\n  "variables": {\n    "input": {\n      "nombre": "Nueva Plantilla",\n      "codigo": "NP-001",\n      "version": "1.0",\n      "contenido": "<p>Contenido HTML</p>",\n      "requiereAceptacion": true,\n      "solicitarAceptacion": false,\n      "procesoId": "abc-123"\n    }\n  }\n}`}
        response={`{\n  "data": {\n    "createPlantilla": {\n      "id": "new-plt-789",\n      "nombre": "Nueva Plantilla",\n      "codigo": "NP-001",\n      "version": "1.0"\n    }\n  }\n}`}
      />

      <EndpointCard method="MUTATION" label="updatePlantilla" description="Actualizar plantilla existente" color="#f59e0b"
        headers={gqlHeaders}
        request={`POST ${APPSYNC_URL}\n\n{\n  "query": "mutation UpdatePlantilla($input: UpdatePlantillaInput!) { updatePlantilla(input: $input) { id nombre codigo } }",\n  "variables": {\n    "input": {\n      "id": "plt-001",\n      "nombre": "Nombre Actualizado",\n      "version": "2.0"\n    }\n  }\n}`}
        response={`{\n  "data": {\n    "updatePlantilla": {\n      "id": "plt-001",\n      "nombre": "Nombre Actualizado",\n      "codigo": "CI-001"\n    }\n  }\n}`}
      />

      <EndpointCard method="MUTATION" label="deletePlantilla" description="Eliminar una plantilla" color="#ef4444"
        headers={gqlHeaders}
        request={`POST ${APPSYNC_URL}\n\n{\n  "query": "mutation DeletePlantilla($input: DeletePlantillaInput!) { deletePlantilla(input: $input) { id } }",\n  "variables": { "input": { "id": "plt-001" } }\n}`}
        response={`{\n  "data": {\n    "deletePlantilla": {\n      "id": "plt-001"\n    }\n  }\n}`}
      />

      {/* ═══ SEND EMAIL ═══ */}
      <SectionTitle icon={<Mail size={20} color="#10b981" />} title="sendEmail" subtitle="Mutación para envío de correos — GraphQL (AppSync + Lambda)" color="#10b981" />

      <EndpointCard method="MUTATION" label="sendEmail" description="Enviar correo electrónico vía SES" color="#f59e0b"
        headers={gqlHeaders}
        request={`POST ${APPSYNC_URL}\n\n{\n  "query": "mutation SendEmail($to: String!, $subject: String!, $body: String!) { sendEmail(to: $to, subject: $subject, body: $body) }",\n  "variables": {\n    "to": "cliente@example.com",\n    "subject": "Documentos pendientes",\n    "body": "<h1>Hola</h1><p>Tienes documentos por firmar.</p>"\n  }\n}`}
        response={`{\n  "data": {\n    "sendEmail": "{\\"statusCode\\":200,\\"message\\":\\"Email sent successfully\\"}"\n  }\n}`}
      />

      {/* ═══ LOPD REST ═══ */}
      <SectionTitle icon={<ExternalLink size={20} color="#ec4899" />} title="LOPD Transacciones" subtitle="API REST externa para gestión de transacciones LOPD" color="#ec4899" />

      <EndpointCard method="POST" label="/rest/faceid/lopd/create" description="Crear transacción LOPD" color="#3b82f6"
        headers={lopdHeaders}
        request={`POST ${LOPD_BASE_URL}/rest/faceid/lopd/create\n\n{\n  "cedula": "0912345678",\n  "ip": "192.168.1.1",\n  "nombres": "Juan",\n  "apellidoPaterno": "Pérez",\n  "apellidoMaterno": "López",\n  "correo": "juan@example.com",\n  "telefono": "0991234567",\n  "channel": "WEB",\n  "storeId": "STORE-001",\n  "proceso": ["proceso-id-1"]\n}`}
        response={`{\n  "statusCode": 200,\n  "body": {\n    "id": "txn-uuid-001",\n    "estado": "pendiente",\n    "url": "https://master.d373a3mueuc4js.amplifyapp.com/?id=txn-uuid-001"\n  }\n}`}
      />

      <EndpointCard method="POST" label="/rest/faceid/lopd/get" description="Obtener transacciones (todas o por ID)" color="#10b981"
        headers={lopdHeaders}
        request={`POST ${LOPD_BASE_URL}/rest/faceid/lopd/get?id=txn-uuid-001\n\n{}`}
        response={`{\n  "statusCode": 200,\n  "body": {\n    "id": "txn-uuid-001",\n    "cedula": "0912345678",\n    "nombres": "Juan",\n    "estado": "procesado",\n    "createdAt": "2025-01-15T10:00:00Z"\n  }\n}`}
      />

      <EndpointCard method="POST" label="/rest/faceid/lopd/update" description="Actualizar estado de transacción" color="#f59e0b"
        headers={lopdHeaders}
        request={`POST ${LOPD_BASE_URL}/rest/faceid/lopd/update?id=txn-uuid-001\n\n{\n  "estado": "procesado"\n}`}
        response={`{\n  "statusCode": 200,\n  "body": {\n    "id": "txn-uuid-001",\n    "estado": "procesado",\n    "updatedAt": "2025-01-15T12:00:00Z"\n  }\n}`}
      />

      {/* Schema reference */}
      <div style={{ marginTop: 48, marginBottom: 32 }}>
        <SectionTitle icon={<Database size={20} color="#6366f1" />} title="Esquemas de Datos" subtitle="Definición de los modelos utilizados en la API" color="#6366f1" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: 12, color: 'var(--text-primary)' }}>Proceso</h4>
            <CodeBlock lang="typescript" code={`{
  id: ID!           // Auto-generado
  nombre: String!   // Nombre del proceso
  descripcion: String
  tituloLanding: String
  encabezadoLanding: String
  plantillas: [Plantilla] // Relación 1:N
  createdAt: AWSDateTime  // Auto
  updatedAt: AWSDateTime  // Auto
}`} />
          </div>
          <div className="glass-card" style={{ padding: 20 }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: 12, color: 'var(--text-primary)' }}>Plantilla</h4>
            <CodeBlock lang="typescript" code={`{
  id: ID!            // Auto-generado
  nombre: String!    // Nombre de la plantilla
  codigo: String!    // Código único
  version: String
  url: String
  contenido: String  // HTML del documento
  requiereAceptacion: Boolean
  solicitarAceptacion: Boolean
  procesoId: ID      // FK a Proceso
  proceso: Proceso   // Relación N:1
  createdAt: AWSDateTime  // Auto
  updatedAt: AWSDateTime  // Auto
}`} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px 0', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        Plantillas API Documentation — Generado automáticamente desde el esquema Amplify Gen 2
      </div>
    </div>
  );
};
