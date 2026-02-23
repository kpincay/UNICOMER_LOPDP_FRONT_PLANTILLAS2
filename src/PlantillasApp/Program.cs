using System.Text;
using Amazon;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.Runtime;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PlantillasApp.Repositories;
using PlantillasApp.Services;

var builder = WebApplication.CreateBuilder(args);

// ───────────────────────────────────────────────
// Cargar configuración local/sensible
// ───────────────────────────────────────────────
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

// ───────────────────────────────────────────────
// Amazon DynamoDB
// ───────────────────────────────────────────────
var awsSection = builder.Configuration.GetSection("AWS");
var region = awsSection["Region"] ?? "us-east-1";
var accessKey = awsSection["AccessKey"];
var secretKey = awsSection["SecretKey"];

AmazonDynamoDBClient dynamoClient;

if (!string.IsNullOrEmpty(accessKey) && !string.IsNullOrEmpty(secretKey))
{
    // Credenciales explícitas (desarrollo local)
    var credentials = new BasicAWSCredentials(accessKey, secretKey);
    dynamoClient = new AmazonDynamoDBClient(credentials, RegionEndpoint.GetBySystemName(region));
}
else
{
    // Credenciales por defecto (IAM Role en AWS - para producción)
    dynamoClient = new AmazonDynamoDBClient(RegionEndpoint.GetBySystemName(region));
}

builder.Services.AddSingleton<IAmazonDynamoDB>(dynamoClient);
builder.Services.AddSingleton<IDynamoDBContext>(new DynamoDBContextBuilder().WithDynamoDBClient(() => dynamoClient).Build());

// ───────────────────────────────────────────────
// Inyección de Dependencias
// ───────────────────────────────────────────────
builder.Services.AddScoped<IPlantillaRepository, DynamoDbPlantillaRepository>();
builder.Services.AddScoped<IPlantillaService, PlantillaService>();
builder.Services.AddSingleton<IJwtService, JwtService>();

// ───────────────────────────────────────────────
// JWT Authentication
// ───────────────────────────────────────────────
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? "PlantillasApp_SuperSecretKey_Demo_2024_Min32Chars!";
var jwtIssuer = jwtSection["Issuer"] ?? "PlantillasApp";
var jwtAudience = jwtSection["Audience"] ?? "PlantillasApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

// ───────────────────────────────────────────────
// Controllers + Swagger
// ───────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Plantillas API",
        Version = "v1",
        Description = "API para gestión de plantillas de documentos"
    });

    // Esquema Bearer para Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingrese el token JWT. Ejemplo: eyJhbGciOiJI..."
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ───────────────────────────────────────────────
// CORS
// ───────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ───────────────────────────────────────────────
// Middleware Pipeline
// ───────────────────────────────────────────────

// Swagger siempre habilitado para demo
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Plantillas API v1");
});

// Archivos estáticos (Frontend)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Fallback para SPA - cualquier ruta no-API sirve index.html
app.MapFallbackToFile("index.html");

app.Run();
