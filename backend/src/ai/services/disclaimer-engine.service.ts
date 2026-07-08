import { Injectable } from '@nestjs/common';

/**
 * Disclaimer Engine Service
 *
 * Attaches mandatory financial disclaimers to all AI-generated content.
 * Ensures every user-facing AI response includes a disclaimer stating
 * the content is informational only and not investment advice.
 *
 * Requirements: 1.5, 7.4
 */
@Injectable()
export class DisclaimerEngineService {
  /**
   * The standard financial disclaimer appended to all AI responses.
   */
  static readonly FINANCIAL_DISCLAIMER =
    'This information is for educational purposes only and does not constitute investment advice. Always consult a qualified financial advisor before making investment decisions.';

  /**
   * Returns the financial disclaimer text.
   */
  getDisclaimer(): string {
    return DisclaimerEngineService.FINANCIAL_DISCLAIMER;
  }

  /**
   * Appends the financial disclaimer to an AI response.
   * If the response already contains the disclaimer, it is returned unchanged
   * to avoid double-appending.
   *
   * @param response - The AI-generated response text
   * @returns The response with the disclaimer appended
   */
  appendDisclaimer(response: string): string {
    if (this.hasDisclaimer(response)) {
      return response;
    }

    return `${response}\n\n---\n${DisclaimerEngineService.FINANCIAL_DISCLAIMER}`;
  }

  /**
   * Checks whether the given text already contains the financial disclaimer.
   *
   * @param text - The text to check
   * @returns true if the disclaimer is already present
   */
  hasDisclaimer(text: string): boolean {
    return text.includes(DisclaimerEngineService.FINANCIAL_DISCLAIMER);
  }
}
