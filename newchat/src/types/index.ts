export interface Admin {
  _id: string;
  userId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  _id: string;
  name: string;
  settings: {
    welcomeMessage?: string;
    supportEmail?: string;
    maxMessageLength?: number;
    customThemeColor?: string;
    [key: string]: any;
  };
  logo?: {
    url: string;
    publicId: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
