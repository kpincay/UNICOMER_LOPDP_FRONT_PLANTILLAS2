using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.DataModel;
using Amazon.DynamoDBv2.DocumentModel;
using PlantillasApp.Models;

namespace PlantillasApp.Repositories;

public class DynamoDbPlantillaRepository : IPlantillaRepository
{
    private readonly IDynamoDBContext _context;
    private readonly ILogger<DynamoDbPlantillaRepository> _logger;

    public DynamoDbPlantillaRepository(
        IDynamoDBContext context,
        ILogger<DynamoDbPlantillaRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<Plantilla>> GetAllAsync()
    {
        try
        {
            var conditions = new List<ScanCondition>();
            var results = await _context.ScanAsync<Plantilla>(conditions).GetRemainingAsync();
            _logger.LogInformation("Se obtuvieron {Count} plantillas de DynamoDB", results.Count);
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener todas las plantillas de DynamoDB");
            throw;
        }
    }

    public async Task<Plantilla?> GetByIdAsync(string id)
    {
        try
        {
            var plantilla = await _context.LoadAsync<Plantilla>(id);
            if (plantilla != null)
            {
                _logger.LogInformation("Plantilla encontrada: {Id}", id);
            }
            else
            {
                _logger.LogWarning("Plantilla no encontrada: {Id}", id);
            }
            return plantilla;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al obtener la plantilla {Id} de DynamoDB", id);
            throw;
        }
    }

    public async Task<Plantilla> CreateAsync(Plantilla plantilla)
    {
        try
        {
            await _context.SaveAsync(plantilla);
            _logger.LogInformation("Plantilla creada: {Id}", plantilla.IdPlantilla);
            return plantilla;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al crear la plantilla en DynamoDB");
            throw;
        }
    }

    public async Task<Plantilla> UpdateAsync(Plantilla plantilla)
    {
        try
        {
            await _context.SaveAsync(plantilla);
            _logger.LogInformation("Plantilla actualizada: {Id}", plantilla.IdPlantilla);
            return plantilla;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al actualizar la plantilla {Id} en DynamoDB", plantilla.IdPlantilla);
            throw;
        }
    }

    public async Task DeleteAsync(string id)
    {
        try
        {
            await _context.DeleteAsync<Plantilla>(id);
            _logger.LogInformation("Plantilla eliminada: {Id}", id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al eliminar la plantilla {Id} de DynamoDB", id);
            throw;
        }
    }
}
