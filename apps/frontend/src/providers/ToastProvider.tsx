import { Toaster } from '@/components/ui/sonner';
import { ToastService } from '@/services/toast.service';
import React, { createContext, ReactNode, useContext } from 'react';

interface ToastContextType {
	toast: ToastService;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
	children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
	const toastService = ToastService.getInstance();

	return (
		<ToastContext.Provider value={{ toast: toastService }}>
			{children}
			<Toaster
				position='top-right'
				richColors
			/>
		</ToastContext.Provider>
	);
};

export const useToast = (): ToastService => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context.toast;
};
