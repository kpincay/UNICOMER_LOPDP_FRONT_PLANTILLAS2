using Amazon.DynamoDBv2.DataModel;

namespace PlantillasApp.Models;

[DynamoDBTable("Plantillas")]
public class Plantilla
{
    [DynamoDBHashKey("id_plantilla")]
    public string IdPlantilla { get; set; } = string.Empty;

    [DynamoDBProperty("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [DynamoDBProperty("codigo")]
    public string Codigo { get; set; } = string.Empty;

    [DynamoDBProperty("version_doc")]
    public string VersionDoc { get; set; } = string.Empty;

    [DynamoDBProperty("url")]
    public string Url { get; set; } = string.Empty;

    [DynamoDBProperty("contenido")]
    public string Contenido { get; set; } = string.Empty;

    [DynamoDBProperty("requiere_aceptacion")]
    public bool RequiereAceptacion { get; set; }

    [DynamoDBProperty("solicitar_aceptacion")]
    public bool SolicitarAceptacion { get; set; }
}
