using PlantillasApp.Models;

namespace PlantillasApp.Repositories;

public interface IPlantillaRepository
{
    Task<IEnumerable<Plantilla>> GetAllAsync();
    Task<Plantilla?> GetByIdAsync(string id);
    Task<Plantilla> CreateAsync(Plantilla plantilla);
    Task<Plantilla> UpdateAsync(Plantilla plantilla);
    Task DeleteAsync(string id);
}
