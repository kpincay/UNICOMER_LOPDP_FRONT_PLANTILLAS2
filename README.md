# 📄 Plantillas — Sistema de Gestión de Documentos

Aplicación monolítica .NET 9 (Web API + Frontend HTML/JS) con Amazon DynamoDB para la gestión de plantillas de documentos.

## 🚀 Tecnologías

- **.NET 9** — Web API con Controllers
- **Amazon DynamoDB** — Base de datos NoSQL
- **JWT** — Autenticación con JSON Web Tokens
- **Swagger/OpenAPI** — Documentación de API
- **HTML/CSS/JS** — Frontend moderno con diseño premium

## 📋 Requisitos Previos

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [AWS CLI](https://aws.amazon.com/cli/) configurado con tus credenciales
- Cuenta de AWS con permisos en DynamoDB

## ⚡ Configuración Rápida

### 1. Crear tabla DynamoDB en AWS

```bash
aws dynamodb create-table \
  --table-name Plantillas \
  --attribute-definitions AttributeName=id_plantilla,AttributeType=S \
  --key-schema AttributeName=id_plantilla,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

> 💡 **PAY_PER_REQUEST** = sin costo fijo, ideal para demos.

### 2. Configurar credenciales locales

Edita el archivo `src/PlantillasApp/appsettings.Local.json`:

```json
{
  "AWS": {
    "AccessKey": "TU_AWS_ACCESS_KEY",
    "SecretKey": "TU_AWS_SECRET_KEY",
    "Region": "us-east-1"
  },
  "Jwt": {
    "Key": "TuClaveSecretaDeAlMenos32Caracteres!"
  },
  "Auth": {
    "Username": "admin",
    "Password": "admin123"
  }
}
```

> ⚠️ Este archivo está en `.gitignore`. Nunca lo subas al repositorio.

### 3. Ejecutar la aplicación

```bash
cd src/PlantillasApp
dotnet run
```

La app estará disponible en:
- **Frontend**: http://localhost:5000
- **Swagger**: http://localhost:5000/swagger
- **Credenciales demo**: `admin` / `admin123`

## 🏗️ Estructura del Proyecto

```
plantillas/
├── PlantillasApp.sln
├── src/PlantillasApp/
│   ├── Controllers/         # API endpoints
│   ├── Models/              # Entidad DynamoDB
│   ├── DTOs/                # Data Transfer Objects
│   ├── Repositories/        # Acceso a DynamoDB
│   ├── Services/            # Lógica de negocio + JWT
│   ├── wwwroot/             # Frontend (HTML/CSS/JS)
│   ├── Program.cs           # Configuración principal
│   ├── appsettings.json     # Config pública
│   └── appsettings.Local.json  # Config sensible (gitignored)
├── amplify.yml              # Pipeline Amplify (frontend)
├── Dockerfile               # Build para App Runner
└── README.md
```

## 🔐 Endpoints de la API

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/login` | Login → JWT | ❌ |
| GET | `/api/plantillas` | Listar todas | ✅ |
| GET | `/api/plantillas/{id}` | Obtener por ID | ✅ |
| POST | `/api/plantillas` | Crear | ✅ |
| PUT | `/api/plantillas/{id}` | Actualizar | ✅ |
| DELETE | `/api/plantillas/{id}` | Eliminar | ✅ |

## 🐳 Despliegue con Docker (AWS App Runner)

### Build local
```bash
docker build -t plantillas-app .
docker run -p 8080:8080 \
  -e AWS__AccessKey=TU_KEY \
  -e AWS__SecretKey=TU_SECRET \
  -e AWS__Region=us-east-1 \
  -e Jwt__Key=TuClaveSecretaDeAlMenos32Caracteres! \
  plantillas-app
```

### Deploy a AWS App Runner
1. Sube la imagen a Amazon ECR
2. Crea un servicio en App Runner apuntando a la imagen ECR
3. Configura las variables de entorno en App Runner
4. App Runner asigna un URL público automáticamente

## 📊 Costos Estimados (Demo)

| Servicio | Costo Estimado |
|----------|---------------|
| DynamoDB (On-Demand) | ~$0.00 (free tier: 25 WCU/RCU) |
| App Runner (1 vCPU, 2GB) | ~$5-10/mes (se pausa automáticamente) |
| ECR (imagen Docker) | ~$0.10/mes |
| **Total** | **~$5-10/mes** |

## 📝 Licencia

Proyecto de demostración.
