using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PlantillasApp.DTOs;
using PlantillasApp.Models;
using PlantillasApp.Services;

namespace PlantillasApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlantillasController : ControllerBase
{
    private readonly IPlantillaService _service;
    private readonly ILogger<PlantillasController> _logger;

    public PlantillasController(
        IPlantillaService service,
        ILogger<PlantillasController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>
    /// Obtener todas las plantillas
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Plantilla>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var plantillas = await _service.GetAllAsync();
            return Ok(plantillas);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener plantillas");
            return StatusCode(500, new { message = "Error interno del servidor", detail = ex.Message });
        }
    }

    /// <summary>
    /// Obtener una plantilla por su ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Plantilla), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            var plantilla = await _service.GetByIdAsync(id);
            if (plantilla == null)
            {
                return NotFound(new { message = $"Plantilla con ID '{id}' no encontrada" });
            }
            return Ok(plantilla);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener plantilla {Id}", id);
            return StatusCode(500, new { message = "Error interno del servidor", detail = ex.Message });
        }
    }

    /// <summary>
    /// Crear una nueva plantilla
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Plantilla), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] PlantillaCreateDto dto)
    {
        try
        {
            var plantilla = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = plantilla.IdPlantilla }, plantilla);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear plantilla");
            return StatusCode(500, new { message = "Error interno del servidor", detail = ex.Message });
        }
    }

    /// <summary>
    /// Actualizar una plantilla existente
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Plantilla), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(string id, [FromBody] PlantillaUpdateDto dto)
    {
        try
        {
            var plantilla = await _service.UpdateAsync(id, dto);
            return Ok(plantilla);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Plantilla con ID '{id}' no encontrada" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar plantilla {Id}", id);
            return StatusCode(500, new { message = "Error interno del servidor", detail = ex.Message });
        }
    }

    /// <summary>
    /// Eliminar una plantilla
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string id)
    {
        try
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Plantilla con ID '{id}' no encontrada" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar plantilla {Id}", id);
            return StatusCode(500, new { message = "Error interno del servidor", detail = ex.Message });
        }
    }
}
