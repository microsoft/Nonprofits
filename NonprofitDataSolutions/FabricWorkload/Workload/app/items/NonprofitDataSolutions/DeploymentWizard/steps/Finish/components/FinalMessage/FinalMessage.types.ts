export type FinalMessageType = 'success' | 'error';

export interface FinalMessageProps {
	type: FinalMessageType;
	title: string;
	description: string;
}
