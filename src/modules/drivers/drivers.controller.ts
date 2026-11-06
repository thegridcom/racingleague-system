import { Request, Response } from 'express';
import { DriversService } from './drivers.service';
import { PLATFORM_OPTIONS } from '../../core/types';
import { DiscordBot } from '../../bot/bot';

export class DriversController {
  public static async getOnboardingPage(req: Request, res: Response) {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    res.render('drivers/onboarding', {
      pageTitle: 'Fahrer-Registrierung & Onboarding | the grid.',
      user: req.session.user,
      platforms: PLATFORM_OPTIONS,
    });
  }

  public static async postOnboarding(req: Request, res: Response) {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const { eaId, platform, platformUsername, gamertag, raceNumber, assists, experience } = req.body;
    const parsedNumber = parseInt(raceNumber, 10);

    // Validierung: EA-ID ist IMMER Pflicht für Crossplay Lobbies
    if (!eaId || typeof eaId !== 'string' || eaId.trim().length < 2) {
      req.session.flashMessage = {
        type: 'danger',
        text: 'Bitte gib deinen exakten EA-Namen / deine EA-ID an (zwingend für Ingame-Einladungen in F1 Lobbies).',
      };
      return res.redirect('/driver/onboarding');
    }

    // Plattform Validierung
    const validPlatforms = ['PC_STEAM', 'PC_EA', 'PC_XBOX', 'PC_EPIC', 'PLAYSTATION', 'XBOX', 'PC', 'PS5'];
    if (!platform || !validPlatforms.includes(platform)) {
      req.session.flashMessage = {
        type: 'danger',
        text: 'Bitte wähle deine Plattform (Steam, EA App, Xbox App, Epic Games, PlayStation oder Xbox).',
      };
      return res.redirect('/driver/onboarding');
    }

    // Plattform-spezifischer Name
    const effectivePlatformUser = (platformUsername && typeof platformUsername === 'string' && platformUsername.trim().length >= 2)
      ? platformUsername.trim()
      : (gamertag && typeof gamertag === 'string' && gamertag.trim().length >= 2)
        ? gamertag.trim()
        : eaId.trim();

    if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 99) {
      req.session.flashMessage = {
        type: 'danger',
        text: 'Die Startnummer muss zwischen 1 und 99 liegen.',
      };
      return res.redirect('/driver/onboarding');
    }

    // Unique-Check für Startnummer
    const isAvailable = await DriversService.checkRaceNumberAvailable(parsedNumber, req.session.user.id);
    if (!isAvailable) {
      req.session.flashMessage = {
        type: 'danger',
        text: `Die Startnummer #${parsedNumber} ist leider bereits von einem anderen Fahrer vergeben. Bitte wähle eine freie Nummer.`,
      };
      return res.redirect('/driver/onboarding');
    }

    try {
      const updatedUser = await DriversService.updateDriverProfile(req.session.user.id, {
        eaId,
        platform,
        platformUsername: effectivePlatformUser,
        gamertag: effectivePlatformUser,
        raceNumber: parsedNumber,
        assists,
        experience,
      });

      req.session.user = {
        ...req.session.user,
        eaId: updatedUser.eaId,
        platform: updatedUser.platform,
        platformUsername: updatedUser.platformUsername,
        gamertag: updatedUser.gamertag,
        raceNumber: updatedUser.raceNumber,
        assists: updatedUser.assists,
        experience: updatedUser.experience,
      };

      req.session.flashMessage = {
        type: 'success',
        text: `Willkommen im Fahrerfeld, #${parsedNumber} ${updatedUser.gamertag}! Dein Profil ist startklar.`,
      };

      // Discord Fahrerfeld-Live-Embed aktualisieren (asynchron)
      DiscordBot.updateLiveRosterMessage().catch((e) => console.warn('Roster Live Update Error:', e.message));

      return res.redirect('/driver/dashboard');
    } catch (err: any) {
      console.error('Fehler beim Fahrer-Onboarding:', err);
      req.session.flashMessage = {
        type: 'danger',
        text: 'Fehler beim Speichern des Profils. Bitte prüfe deine Eingaben.',
      };
      return res.redirect('/driver/onboarding');
    }
  }

  public static async getDashboardPage(req: Request, res: Response) {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const data = await DriversService.getDriverDashboardData(req.session.user.id);
    if (!data) {
      req.session.flashMessage = {
        type: 'danger',
        text: 'Fahrerprofil nicht gefunden.',
      };
      return res.redirect('/auth/login');
    }

    res.render('drivers/dashboard', {
      pageTitle: `Fahrer-Cockpit: ${data.user.gamertag || data.user.discordUsername} | the grid.`,
      driverData: data,
      platforms: PLATFORM_OPTIONS,
    });
  }

  public static async postUpdateProfile(req: Request, res: Response) {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const { eaId, platform, platformUsername, gamertag, raceNumber, assists, experience } = req.body;
    const parsedNumber = parseInt(raceNumber, 10);

    if (!eaId || typeof eaId !== 'string' || eaId.trim().length < 2) {
      req.session.flashMessage = {
        type: 'danger',
        text: 'Bitte gib deinen EA-Namen / deine EA-ID an.',
      };
      return res.redirect('/driver/dashboard#profil');
    }

    const effectivePlatformUser = (platformUsername && typeof platformUsername === 'string' && platformUsername.trim().length >= 2)
      ? platformUsername.trim()
      : (gamertag && typeof gamertag === 'string' && gamertag.trim().length >= 2)
        ? gamertag.trim()
        : eaId.trim();

    if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 99) {
      req.session.flashMessage = {
        type: 'danger',
        text: 'Die Startnummer muss zwischen 1 und 99 liegen.',
      };
      return res.redirect('/driver/dashboard#profil');
    }

    const isAvailable = await DriversService.checkRaceNumberAvailable(parsedNumber, req.session.user.id);
    if (!isAvailable) {
      req.session.flashMessage = {
        type: 'danger',
        text: `Die Startnummer #${parsedNumber} ist bereits vergeben.`,
      };
      return res.redirect('/driver/dashboard#profil');
    }

    await DriversService.updateDriverProfile(req.session.user.id, {
      eaId,
      platform,
      platformUsername: effectivePlatformUser,
      gamertag: effectivePlatformUser,
      raceNumber: parsedNumber,
      assists,
      experience,
    });

    // Discord Fahrerfeld-Live-Embed aktualisieren
    DiscordBot.updateLiveRosterMessage().catch((e) => console.warn('Roster Live Update Error:', e.message));

    req.session.flashMessage = {
      type: 'success',
      text: 'Profil erfolgreich aktualisiert.',
    };
    return res.redirect('/driver/dashboard#profil');
  }

  /**
   * DSGVO Art. 17: Account-Löschung mit doppelter Bestätigung
   */
  public static async postDeleteAccountGdpr(req: Request, res: Response) {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const { confirmationText } = req.body;
    const expectedConfirm = 'LÖSCHEN';

    if (!confirmationText || confirmationText.trim().toUpperCase() !== expectedConfirm) {
      req.session.flashMessage = {
        type: 'danger',
        text: `Löschung abgebrochen: Bitte tippe exakt "${expectedConfirm}" ein, um den Vorgang zu bestätigen.`,
      };
      return res.redirect('/driver/dashboard');
    }

    const userId = req.session.user.id;

    try {
      await DriversService.deleteDriverAccountGdpr(userId);

      // Discord Fahrerfeld-Live-Embed aktualisieren
      DiscordBot.updateLiveRosterMessage().catch((e) => console.warn('Roster Live Update Error:', e.message));

      // Session zerstören
      req.session.destroy((err) => {
        if (err) console.error('Fehler beim Zerstören der Session nach DSGVO-Löschung:', err);
        res.clearCookie('connect.sid');
        return res.redirect(303, '/?deleted=true');
      });
    } catch (err: any) {
      console.error('Fehler bei der DSGVO-Löschung nach Art. 17:', err);
      req.session.flashMessage = {
        type: 'danger',
        text: 'Ein Fehler ist bei der Löschung aufgetreten. Bitte wende dich an einen Administrator.',
      };
      return res.redirect('/driver/dashboard');
    }
  }

  public static async getDriversRoster(req: Request, res: Response) {
    const drivers = await DriversService.getAllDrivers();
    res.render('drivers/roster', {
      pageTitle: 'Fahrerfeld & Startnummern | the grid. - racing league',
      drivers,
    });
  }
}
