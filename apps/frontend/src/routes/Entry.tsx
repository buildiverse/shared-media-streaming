import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export function Entry() {
	return (
		<div className='min-h-screen bg-background flex items-center justify-center p-4'>
			<div className='w-full max-w-md'>
				<Card className='shadow-xl'>
					<CardHeader className='text-center space-y-4'>
						<div className='mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center'>
							<span className='text-2xl font-bold text-white'>SMS</span>
						</div>
						<CardTitle className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
							Shared Media Streaming
						</CardTitle>
						<CardDescription className='text-lg'>
							Stream, share, and enjoy media together in real-time
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						<div className='space-y-3'>
							<Button
								asChild
								className='w-full'
								size='lg'
							>
								<Link to='/login'>Sign In</Link>
							</Button>
							<Button
								asChild
								variant='outline'
								className='w-full'
								size='lg'
							>
								<Link to='/register'>Create Account</Link>
							</Button>
						</div>
						<div className='text-center text-sm text-muted-foreground'>
							<p>Join thousands of users sharing media experiences</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
