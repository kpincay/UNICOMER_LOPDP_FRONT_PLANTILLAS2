using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace PlantillasApp.Services;

public interface IJwtService
{
    string GenerateToken(string username);
    bool ValidateCredentials(string username, string password);
}

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<JwtService> _logger;

    public JwtService(IConfiguration configuration, ILogger<JwtService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public bool ValidateCredentials(string username, string password)
    {
        // Para demo: credenciales en archivo de configuración local
        var validUser = _configuration["Auth:Username"] ?? "admin";
        var validPass = _configuration["Auth:Password"] ?? "admin123";

        var isValid = username == validUser && password == validPass;

        if (!isValid)
        {
            _logger.LogWarning("Intento de login fallido para usuario: {Username}", username);
        }

        return isValid;
    }

    public string GenerateToken(string username)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = jwtSettings["Key"] ?? throw new InvalidOperationException("JWT Key no configurada");
        var issuer = jwtSettings["Issuer"] ?? "PlantillasApp";
        var audience = jwtSettings["Audience"] ?? "PlantillasApp";
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        _logger.LogInformation("Token JWT generado para usuario: {Username}", username);

        return tokenString;
    }
}
