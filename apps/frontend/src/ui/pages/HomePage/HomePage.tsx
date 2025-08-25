// HomePage Component

import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../../types';
import { Button } from '../../atoms/Button';

export interface HomePageProps {
	user: User | null;
	className?: string;
}

export const HomePage: React.FC<HomePageProps> = ({ user, className = '' }) => {
	const pageClasses = ['home-page', className].filter(Boolean).join(' ');

	return (
		<div className={pageClasses}>
			<section className='home-page__hero'>
				<div className='home-page__hero-content'>
					<h1 className='home-page__title'>Share and Stream Media Together</h1>
					<p className='home-page__subtitle'>
						Upload, share, and enjoy audio and video content with your community. Real-time
						synchronization and collaborative viewing experience.
					</p>

					<div className='home-page__cta'>
						{user ? (
							<div className='home-page__user-actions'>
								<Link to='/media'>
									<Button
										variant='primary'
										size='large'
									>
										Browse Media
									</Button>
								</Link>
								<Link to='/upload'>
									<Button
										variant='secondary'
										size='large'
									>
										Upload New Media
									</Button>
								</Link>
							</div>
						) : (
							<div className='home-page__guest-actions'>
								<Link to='/register'>
									<Button
										variant='primary'
										size='large'
									>
										Get Started
									</Button>
								</Link>
								<Link to='/login'>
									<Button
										variant='ghost'
										size='large'
									>
										Sign In
									</Button>
								</Link>
							</div>
						)}
					</div>
				</div>
			</section>

			<section className='home-page__features'>
				<div className='home-page__features-content'>
					<h2 className='home-page__section-title'>Features</h2>

					<div className='home-page__features-grid'>
						<div className='home-page__feature'>
							<h3>Media Sharing</h3>
							<p>Upload and share your favorite audio and video content with the community.</p>
						</div>

						<div className='home-page__feature'>
							<h3>Real-time Sync</h3>
							<p>Watch and listen together with synchronized playback across all devices.</p>
						</div>

						<div className='home-page__feature'>
							<h3>Collaborative Viewing</h3>
							<p>Join viewing rooms and enjoy media with friends and family in real-time.</p>
						</div>

						<div className='home-page__feature'>
							<h3>Secure Storage</h3>
							<p>Your media is safely stored and accessible from anywhere, anytime.</p>
						</div>
					</div>
				</div>
			</section>

			<section className='home-page__how-it-works'>
				<div className='home-page__how-it-works-content'>
					<h2 className='home-page__section-title'>How It Works</h2>

					<div className='home-page__steps'>
						<div className='home-page__step'>
							<div className='home-page__step-number'>1</div>
							<h3>Upload</h3>
							<p>Upload your audio or video files with a simple drag-and-drop interface.</p>
						</div>

						<div className='home-page__step'>
							<div className='home-page__step-number'>2</div>
							<h3>Share</h3>
							<p>Share your media with the community or create private viewing rooms.</p>
						</div>

						<div className='home-page__step'>
							<div className='home-page__step-number'>3</div>
							<h3>Enjoy Together</h3>
							<p>Watch and listen together with synchronized playback and real-time interaction.</p>
						</div>
					</div>
				</div>
			</section>

			<section className='home-page__cta-section'>
				<div className='home-page__cta-content'>
					<h2>Ready to Get Started?</h2>
					<p>Join thousands of users sharing and enjoying media together.</p>

					{!user && (
						<Link to='/register'>
							<Button
								variant='primary'
								size='large'
							>
								Create Account
							</Button>
						</Link>
					)}
				</div>
			</section>
		</div>
	);
};
