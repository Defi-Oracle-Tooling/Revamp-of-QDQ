import { QuestionRenderer } from "../src/questionRenderer";
// Explicit readline mock to provide createInterface with question & close
jest.mock('readline', () => ({
  __esModule: true,
  default: {
    createInterface: () => ({
      question: (_prompt: string, cb: (answer: string) => void) => cb(""),
      close: () => {}
    })
  },
  createInterface: () => ({
    question: (_prompt: string, cb: (answer: string) => void) => cb(""),
    close: () => {}
  })
}));
import { QuestionTree } from "../src/questions/types";

describe("QuestionRenderer", () => {
  describe("constructor", () => {
    it("should create QuestionRenderer with questions", () => {
      const questions: QuestionTree = {
        name: "test",
        prompt: "Test question",
        options: [
          { label: "Option 1", value: "opt1", default: true },
          { label: "Option 2", value: "opt2" }
        ]
      };

      const renderer = new QuestionRenderer(questions);
      expect(renderer).toBeInstanceOf(QuestionRenderer);
    });

    it("should handle forceDefaults parameter", () => {
      const questions: QuestionTree = {
        name: "test",
        prompt: "Test question",
        options: [
          { label: "Option 1", value: "opt1", default: true }
        ]
      };

      const renderer1 = new QuestionRenderer(questions);
      const renderer2 = new QuestionRenderer(questions, true);

      expect(renderer1).toBeInstanceOf(QuestionRenderer);
      expect(renderer2).toBeInstanceOf(QuestionRenderer);
    });
  });

  describe("render with forceDefaults", () => {
    it("should use default values when forceDefaults is true", async () => {
      const questions: QuestionTree = {
        name: "clientType",
        prompt: "Select client type",
        options: [
          { label: "Besu", value: "besu", default: true },
          { label: "GoQuorum", value: "goquorum" }
        ]
      };

      const renderer = new QuestionRenderer(questions, true);
      const answers = await renderer.render();

      expect(answers).toEqual({ clientType: "besu" });
    });

    it("should handle questions without default when forceDefaults is true", async () => {
      const questions: QuestionTree = {
        name: "clientType",
        prompt: "Select client type",
        options: [
          { label: "Besu", value: "besu" },
          { label: "GoQuorum", value: "goquorum" }
        ]
      };

      const renderer = new QuestionRenderer(questions, true);
      const answers = await renderer.render();

      expect(answers).toEqual({ clientType: "besu" }); // First option used as fallback
    });

    it("should handle nextQuestion in forceDefaults mode", async () => {
      const questions: QuestionTree = {
        name: "clientType",
        prompt: "Select client type",
        options: [
          {
            label: "Besu",
            value: "besu",
            default: true,
            nextQuestion: {
              name: "consensus",
              prompt: "Select consensus",
              options: [
                { label: "IBFT", value: "ibft", default: true },
                { label: "QBFT", value: "qbft" }
              ]
            }
          },
          { label: "GoQuorum", value: "goquorum" }
        ]
      };

      const renderer = new QuestionRenderer(questions, true);
      const answers = await renderer.render();

      expect(answers).toEqual({
        clientType: "besu",
        consensus: "ibft"
      });
    });
  });

  describe("error handling", () => {
    it("should throw error for malformed questions", async () => {
      const questions: QuestionTree = {
        name: "invalid",
        prompt: "Invalid question"
        // No options or transformerValidator
      } as any;

      const renderer = new QuestionRenderer(questions);

      await expect(renderer.render()).rejects.toThrow(/does not include multiple choice options or a free form input transformer/);
    });
  });

  describe("internal structure validation", () => {
    it("should validate question structure with options", () => {
      const questions: QuestionTree = {
        name: "valid",
        prompt: "Valid question with options",
        options: [
          { label: "Option 1", value: "opt1", default: true }
        ]
      };

      const renderer = new QuestionRenderer(questions);
      expect(renderer).toBeDefined();
      expect((renderer as any)._questions).toBe(questions);
    });

    it("should validate question structure with transformer", () => {
      const questions: QuestionTree = {
        name: "valid",
        prompt: "Valid question with transformer",
        transformerValidator: () => undefined
      };

      const renderer = new QuestionRenderer(questions);
      expect(renderer).toBeDefined();
      expect((renderer as any)._questions).toBe(questions);
    });

    it("should handle forceDefaults flag correctly", () => {
      const questions: QuestionTree = {
        name: "test",
        prompt: "Test question",
        options: [{ label: "Test", value: "test" }]
      };

      const renderer1 = new QuestionRenderer(questions);
      const renderer2 = new QuestionRenderer(questions, true);
      const renderer3 = new QuestionRenderer(questions, false);

      expect((renderer1 as any)._forceDefaults).toBe(false);
      expect((renderer2 as any)._forceDefaults).toBe(true);
      expect((renderer3 as any)._forceDefaults).toBe(false);
    });
  });
});