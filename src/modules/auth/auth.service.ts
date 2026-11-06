import axios from 'axios';
import { config } from '../../core/config';
import { prisma } from '../../core/db';

export class AuthService {
  public static getDiscordAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: config.discord.clientId,
      redirect_uri: config.discord.redirectUri,
      response_type: 'code',
      scope: 'identify guilds.members.read',
      state,
      prompt: 'consent',
    });
    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  }

  public static async exchangeCodeForToken(code: string): Promise<string> {
    const data = new URLSearchParams({
      client_id: config.discord.clientId,
      client_secret: config.discord.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.discord.redirectUri,
    });

    const response = await axios.post('https://discord.com/api/v10/oauth2/token', data.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data.access_token;
  }

  public static async getDiscordUser(accessToken: string): Promise<{ id: string; username: string; avatar: string | null }> {
    const response = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      id: response.data.id,
      username: response.data.global_name || response.data.username,
      avatar: response.data.avatar,
    };
  }

  /**
   * Ruft die Rollen-IDs des Discord-Nutzers auf dem Ziel-Server ab.
   * Versucht zuerst die Bot-API, bei Bedarf Fallback auf den User-OAuth-Token (guilds.members.read).
   */
  public static async fetchGuildRoles(discordUserId: string, accessToken?: string): Promise<string[]> {
    if (!config.discord.guildId) {
      console.warn('[AuthService] Keine DISCORD_GUILD_ID konfiguriert.');
      return [];
    }

    // 1. Versuch via Discord Bot Token
    if (config.discord.botToken) {
      try {
        const botRes = await axios.get(
          `https://discord.com/api/v10/guilds/${config.discord.guildId}/members/${discordUserId}`,
          {
            headers: {
              Authorization: `Bot ${config.discord.botToken}`,
            },
            timeout: 5000,
          }
        );
        if (Array.isArray(botRes.data?.roles)) {
          return botRes.data.roles;
        }
      } catch (err: any) {
        console.warn(
          `[AuthService] Bot-Abfrage für Member ${discordUserId} fehlgeschlagen (${err.response?.status || err.message}). Fallback auf OAuth Token...`
        );
      }
    }

    // 2. Fallback via User OAuth2 Access Token (@me/guilds/{guildId}/member)
    if (accessToken) {
      try {
        const oauthRes = await axios.get(
          `https://discord.com/api/v10/users/@me/guilds/${config.discord.guildId}/member`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            timeout: 5000,
          }
        );
        if (Array.isArray(oauthRes.data?.roles)) {
          return oauthRes.data.roles;
        }
      } catch (err: any) {
        console.warn(
          `[AuthService] OAuth-Abfrage für Member ${discordUserId} fehlgeschlagen (${err.response?.status || err.message}).`
        );
      }
    }

    return [];
  }

  /**
   * Prüft die Berechtigung für die Fahrer-Registrierung / den Login:
   * Nur Nutzer mit der Fahrer-Rolle (1545431083905065071) oder einer Admin-Rolle sind autorisiert.
   */
  public static async verifyDriverEligibility(
    discordUserId: string,
    accessToken?: string
  ): Promise<{
    authorized: boolean;
    hasDriverRole: boolean;
    isAdmin: boolean;
    roles: string[];
    role: 'ADMIN' | 'DRIVER' | 'RESERVE';
    errorMessage?: string;
  }> {
    const roles = await this.fetchGuildRoles(discordUserId, accessToken);

    const requiredDriverRoleId = config.discord.driverRoleId || '1545431083905065071';
    const hasDriverRole = roles.includes(requiredDriverRoleId);
    const isAdmin = config.discord.adminRoleIds.some((adminId) => roles.includes(adminId));

    if (!hasDriverRole && !isAdmin) {
      return {
        authorized: false,
        hasDriverRole: false,
        isAdmin: false,
        roles,
        role: 'RESERVE',
        errorMessage: 'Du musst dich vorher einmal bei der Rennleitung registrieren um einen account zu erstellen.',
      };
    }

    const assignedRole = isAdmin ? 'ADMIN' : 'DRIVER';

    return {
      authorized: true,
      hasDriverRole,
      isAdmin,
      roles,
      role: assignedRole,
    };
  }

  public static async syncDiscordUser(
    discordData: { id: string; username: string; avatar: string | null },
    accessToken: string
  ) {
    // 1. Rollen- und Berechtigungsprüfung
    const eligibility = await this.verifyDriverEligibility(discordData.id, accessToken);

    if (!eligibility.authorized) {
      return {
        authorized: false,
        user: null,
        errorMessage: eligibility.errorMessage || 'Du musst dich vorher einmal bei der Rennleitung registrieren um einen account zu erstellen.',
      };
    }

    const existing = await prisma.user.findUnique({
      where: { discordId: discordData.id },
      include: { team: true },
    });

    const isUserAdmin = Boolean(eligibility.isAdmin || existing?.isAdmin || existing?.role === 'ADMIN');
    // Rolle im Fahrerfeld beibehalten (z.B. Stammfahrer DRIVER in einem Rennteam), während isAdmin = true Admin-Rechte sichert!
    const effectiveRole = existing?.teamId ? existing.role : (isUserAdmin ? 'ADMIN' : eligibility.role);

    if (existing) {
      const updatedUser = await prisma.user.update({
        where: { id: existing.id },
        data: {
          discordUsername: discordData.username,
          discordAvatar: discordData.avatar,
          role: effectiveRole,
          isAdmin: isUserAdmin,
          hasDriverRole: eligibility.hasDriverRole,
        },
        include: { team: true },
      });

      return {
        authorized: true,
        user: updatedUser,
        errorMessage: null,
      };
    }

    // Neuer Benutzer wird angelegt
    const newUser = await prisma.user.create({
      data: {
        discordId: discordData.id,
        discordUsername: discordData.username,
        discordAvatar: discordData.avatar,
        role: isUserAdmin ? 'ADMIN' : eligibility.role,
        isAdmin: isUserAdmin,
        hasDriverRole: eligibility.hasDriverRole,
      },
      include: { team: true },
    });

    return {
      authorized: true,
      user: newUser,
      errorMessage: null,
    };
  }
}

