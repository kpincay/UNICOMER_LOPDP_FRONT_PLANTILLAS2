using PlantillasApp.DTOs;
using PlantillasApp.Models;

namespace PlantillasApp.Services;

public interface IPlantillaService
{
    Task<IEnumerable<Plantilla>> GetAllAsync();
    Task<Plantilla?> GetByIdAsync(string id);
    Task<Plantilla> CreateAsync(PlantillaCreateDto dto);
    Task<Plantilla> UpdateAsync(string id, PlantillaUpdateDto dto);
    Task DeleteAsync(string id);
}
