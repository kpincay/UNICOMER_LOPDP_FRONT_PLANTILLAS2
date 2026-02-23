using PlantillasApp.DTOs;
using PlantillasApp.Models;
using PlantillasApp.Repositories;

namespace PlantillasApp.Services;

public class PlantillaService : IPlantillaService
{
    private readonly IPlantillaRepository _repository;
    private readonly ILogger<PlantillaService> _logger;

    public PlantillaService(
        IPlantillaRepository repository,
        ILogger<PlantillaService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<IEnumerable<Plantilla>> GetAllAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task<Plantilla?> GetByIdAsync(string id)
    {
        return await _repository.GetByIdAsync(id);
    }

    public async Task<Plantilla> CreateAsync(PlantillaCreateDto dto)
    {
        var plantilla = new Plantilla
        {
            IdPlantilla = Guid.NewGuid().ToString(),
            Nombre = dto.Nombre,
            Codigo = dto.Codigo,
            VersionDoc = dto.VersionDoc,
            Url = dto.Url,
            Contenido = dto.Contenido,
            RequiereAceptacion = dto.RequiereAceptacion,
            SolicitarAceptacion = dto.SolicitarAceptacion
        };

        _logger.LogInformation("Creando nueva plantilla con ID: {Id}", plantilla.IdPlantilla);
        return await _repository.CreateAsync(plantilla);
    }

    public async Task<Plantilla> UpdateAsync(string id, PlantillaUpdateDto dto)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Plantilla con ID '{id}' no encontrada");
        }

        existing.Nombre = dto.Nombre;
        existing.Codigo = dto.Codigo;
        existing.VersionDoc = dto.VersionDoc;
        existing.Url = dto.Url;
        existing.Contenido = dto.Contenido;
        existing.RequiereAceptacion = dto.RequiereAceptacion;
        existing.SolicitarAceptacion = dto.SolicitarAceptacion;

        _logger.LogInformation("Actualizando plantilla: {Id}", id);
        return await _repository.UpdateAsync(existing);
    }

    public async Task DeleteAsync(string id)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing == null)
        {
            throw new KeyNotFoundException($"Plantilla con ID '{id}' no encontrada");
        }

        _logger.LogInformation("Eliminando plantilla: {Id}", id);
        await _repository.DeleteAsync(id);
    }
}
