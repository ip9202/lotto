// 소셜 로그인 관련 타입 정의

declare global {
  interface Window {
    Kakao: any;
    naver: any;
  }
}

export interface KakaoAuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

export interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account: {
    profile_nickname_needs_agreement: boolean;
    profile_image_needs_agreement: boolean;
    profile: {
      nickname: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email?: string;
  };
}

export interface NaverUserInfo {
  id: string;
  nickname: string;
  name: string;
  email: string;
  gender: string;
  age: string;
  birthday: string;
  profile_image: string;
  birthyear: string;
  mobile: string;
}

export interface SocialLoginResult {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    token_type: string;
    user: any;
  };
  error?: {
    code: string;
    message: string;
  };
}
