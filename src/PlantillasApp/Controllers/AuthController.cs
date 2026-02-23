using Microsoft.AspNetCore.Mvc;
using PlantillasApp.DTOs;
using PlantillasApp.Services;

namespace PlantillasApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IJwtService _jwtService;

    public AuthController(IJwtService jwtService)
    {
        _jwtService = jwtService;
    }

    /// <summary>
    /// Autenticar usuario y obtener token JWT
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (!_jwtService.ValidateCredentials(request.Username, request.Password))
        {
            return Unauthorized(new { message = "Credenciales inválidas" });
        }

        var token = _jwtService.GenerateToken(request.Username);
        var expiration = DateTime.UtcNow.AddMinutes(60);

        return Ok(new LoginResponse
        {
            Token = token,
            Expiration = expiration,
            Username = request.Username
        });
    }
}
