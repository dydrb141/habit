/**
 * Input validation utilities
 */

export const validation = {
  /**
   * Validate email format
   */
  email(email: string): { valid: boolean; error?: string } {
    if (!email) {
      return { valid: false, error: "이메일을 입력해주세요" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: "올바른 이메일 형식이 아닙니다" };
    }

    return { valid: true };
  },

  /**
   * Validate password
   */
  password(password: string): { valid: boolean; error?: string } {
    if (!password) {
      return { valid: false, error: "비밀번호를 입력해주세요" };
    }

    if (password.length < 8) {
      return { valid: false, error: "비밀번호는 최소 8자 이상이어야 합니다" };
    }

    if (password.length > 100) {
      return { valid: false, error: "비밀번호가 너무 깁니다" };
    }

    return { valid: true };
  },

  /**
   * Validate nickname
   */
  nickname(nickname: string): { valid: boolean; error?: string } {
    if (!nickname) {
      return { valid: false, error: "닉네임을 입력해주세요" };
    }

    if (nickname.length < 2) {
      return { valid: false, error: "닉네임은 최소 2자 이상이어야 합니다" };
    }

    if (nickname.length > 20) {
      return { valid: false, error: "닉네임은 최대 20자까지 가능합니다" };
    }

    // Check for invalid characters (optional)
    const nicknameRegex = /^[a-zA-Z0-9가-힣_\s]+$/;
    if (!nicknameRegex.test(nickname)) {
      return { valid: false, error: "닉네임에 특수문자는 사용할 수 없습니다" };
    }

    return { valid: true };
  },

  /**
   * Validate character name
   */
  characterName(name: string): { valid: boolean; error?: string } {
    if (!name || !name.trim()) {
      return { valid: false, error: "이름을 입력해주세요" };
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
      return { valid: false, error: "이름은 최소 2자 이상이어야 합니다" };
    }

    if (trimmed.length > 20) {
      return { valid: false, error: "이름은 최대 20자까지 가능합니다" };
    }

    return { valid: true };
  },

  /**
   * Validate pairing code (6 digits)
   */
  pairingCode(code: string): { valid: boolean; error?: string } {
    if (!code) {
      return { valid: false, error: "페어링 코드를 입력해주세요" };
    }

    if (code.length !== 6) {
      return { valid: false, error: "페어링 코드는 6자리 숫자입니다" };
    }

    if (!/^\d{6}$/.test(code)) {
      return { valid: false, error: "숫자만 입력 가능합니다" };
    }

    return { valid: true };
  },

  /**
   * Validate habit name
   */
  habitName(name: string): { valid: boolean; error?: string } {
    if (!name || !name.trim()) {
      return { valid: false, error: "습관 이름을 입력해주세요" };
    }

    const trimmed = name.trim();

    if (trimmed.length < 2) {
      return { valid: false, error: "습관 이름은 최소 2자 이상이어야 합니다" };
    }

    if (trimmed.length > 50) {
      return { valid: false, error: "습관 이름은 최대 50자까지 가능합니다" };
    }

    return { valid: true };
  },

  /**
   * Sanitize string input (prevent XSS)
   */
  sanitize(input: string): string {
    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  },

  /**
   * Validate number range
   */
  numberRange(
    value: number,
    min: number,
    max: number
  ): { valid: boolean; error?: string } {
    if (isNaN(value)) {
      return { valid: false, error: "올바른 숫자를 입력해주세요" };
    }

    if (value < min) {
      return { valid: false, error: `최소값은 ${min}입니다` };
    }

    if (value > max) {
      return { valid: false, error: `최대값은 ${max}입니다` };
    }

    return { valid: true };
  },
};
