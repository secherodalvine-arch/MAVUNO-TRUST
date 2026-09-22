import { Request, Response, NextFunction } from 'express';
import { APPROVED_RIGHTS } from '../data/approvedRights';
import { geminiService } from '../services/geminiService';
import Complaint, { ComplaintCategory } from '../models/Complaint';

export const getRightsContent = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({
      success: true,
      data: APPROVED_RIGHTS
    });
  } catch (err) {
    next(err);
  }
};

export const askGemini = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const question = req.body.question;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ success: false, error: { message: 'A question is required.' } });
      return;
    }

    const answer = await geminiService.askQuestion(question.trim());
    
    res.json({
      success: true,
      data: { answer }
    });
  } catch (err) {
    next(err);
  }
};

export const submitRemedy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, description } = req.body;
    
    if (!category || typeof category !== 'string' || !description || typeof description !== 'string') {
      res.status(400).json({ success: false, error: { message: 'Category and description are required and must be text.' } });
      return;
    }

    const ALLOWED_CATEGORIES = [
      'payment', 'price', 'quantity', 'quality', 'dealer', 'privacy', 'misrepresentation', 'other'
    ];

    if (!ALLOWED_CATEGORIES.includes(category)) {
      res.status(400).json({ success: false, error: { message: 'Invalid category selected.' } });
      return;
    }

    const categoryMap: Record<string, ComplaintCategory> = {
      payment: ComplaintCategory.NON_PAYMENT,
      price: ComplaintCategory.PRICE_DISPUTE,
      quantity: ComplaintCategory.QUANTITY_DISPUTE,
      quality: ComplaintCategory.QUALITY_DISPUTE,
      dealer: ComplaintCategory.LICENCE_CONCERN,
      privacy: ComplaintCategory.PRIVACY_CONCERN,
      misrepresentation: ComplaintCategory.MISREPRESENTATION,
      other: ComplaintCategory.OTHER,
    };

    // Access the authenticated user safely
    const userId = (req as any).user?.userId;
    if (!userId) {
       res.status(401).json({ success: false, error: { message: 'Unauthorized. Could not identify user.' } });
       return;
    }

    const newComplaint = new Complaint({
      reporterId: userId,
      category: categoryMap[category],
      description: description.trim()
    });

    await newComplaint.save();

    res.json({
      success: true,
      message: 'Your report has been submitted. Depending on the issue, you may also need to contact the appropriate official institution or seek professional legal assistance.'
    });
  } catch (err) {
    next(err);
  }
};

export const getMyComplaints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
       res.status(401).json({ success: false, error: { message: 'Unauthorized. Could not identify user.' } });
       return;
    }

    const complaints = await Complaint.find({ reporterId: userId })
      .select('caseId category description status createdAt updatedAt')
      .sort({ createdAt: -1 }) // newest first
      .exec();

    res.json({
      success: true,
      data: complaints
    });
  } catch (err) {
    next(err);
  }
};
