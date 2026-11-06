import { Request, Response } from 'express';

export class LegalController {
  public static getImpressum(req: Request, res: Response) {
    res.render('legal/impressum', {
      pageTitle: 'Impressum | the grid. - racing league',
    });
  }

  public static getDatenschutz(req: Request, res: Response) {
    res.render('legal/datenschutz', {
      pageTitle: 'Datenschutzerklärung | the grid. - racing league',
    });
  }
}

