import React from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<>
			<Sonner
				theme='dark'
				className='toaster group'
				toastOptions={{
					classNames: {
						toast:
							'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
						description: 'group-[.toast]:text-muted-foreground',
						actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
						cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
					},
				}}
				{...props}
			/>
			<style>
				{`
					/* Add countdown progress bar to all toasts */
					[data-sonner-toast] {
						position: relative;
						overflow: hidden;
					}
					
					[data-sonner-toast]::after {
						content: '';
						position: absolute;
						bottom: 0;
						left: 0;
						height: 3px;
						background: linear-gradient(90deg, #3b82f6, #1d4ed8);
						border-radius: 0 0 8px 8px;
						animation: countdown var(--duration, 4000ms) linear forwards;
						z-index: 1;
					}
					
					[data-sonner-toast][data-type="error"]::after {
						background: linear-gradient(90deg, #ef4444, #dc2626);
					}
					
					[data-sonner-toast][data-type="warning"]::after {
						background: linear-gradient(90deg, #f59e0b, #d97706);
					}
					
					[data-sonner-toast][data-type="success"]::after {
						background: linear-gradient(90deg, #10b981, #059669);
					}
					
					@keyframes countdown {
						from {
							width: 100%;
						}
						to {
							width: 0%;
						}
					}
				`}
			</style>
		</>
	);
};

export { Toaster };
