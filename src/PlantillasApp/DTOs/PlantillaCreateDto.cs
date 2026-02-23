using System.ComponentModel.DataAnnotations;

namespace PlantillasApp.DTOs;

public class PlantillaCreateDto
{
    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(200, ErrorMessage = "El nombre no puede exceder 200 caracteres")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El código es obligatorio")]
    [StringLength(50, ErrorMessage = "El código no puede exceder 50 caracteres")]
    public string Codigo { get; set; } = string.Empty;

    [StringLength(20, ErrorMessage = "La versión no puede exceder 20 caracteres")]
    public string VersionDoc { get; set; } = string.Empty;

    [Url(ErrorMessage = "La URL no es válida")]
    public string Url { get; set; } = string.Empty;

    public string Contenido { get; set; } = string.Empty;

    public bool RequiereAceptacion { get; set; }

    public bool SolicitarAceptacion { get; set; }
}
