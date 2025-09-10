
export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}
