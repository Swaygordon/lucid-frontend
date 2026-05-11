import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useNotification } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabaseClient';
import BackgroundImage from '../assets/background.png';

const Signin = () => {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'client' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Handle email confirmation redirect from Supabase (hash params after email click)
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.replace('#', '?'));
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type         = params.get('type');

    if (accessToken && refreshToken && type === 'signup') {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error }) => {
          if (error) {
            showNotification('Email confirmation failed. Please try signing in.', 'error');
          } else {
            showNotification('Email confirmed! You are now signed in.', 'success');
            navigate('/lucid/');
          }
        });
    }
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      showNotification(error.message, 'error');
      setLoading(false);
      return;
    }

    if (!data.user.email_confirmed_at) {
      showNotification('Please confirm your email before signing in.', 'warning');
      setShowResend(true);
      setLoading(false);
      return;
    }

    // Update last_login timestamp
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    // Fetch role for redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, first_name')
      .eq('id', data.user.id)
      .single();

    // Validate selected account type matches the actual role in DB
    if (profile?.role && profile.role !== formData.role) {
      await supabase.auth.signOut();
      showNotification(
        formData.role === 'client'
          ? 'This account is registered as a Service Provider. Please select "Service Provider" to sign in.'
          : 'This account is registered as a Client. Please select "Client" to sign in.',
        'error'
      );
      setLoading(false);
      return;
    }

    showNotification(`Welcome back${profile?.first_name ? `, ${profile.first_name}` : ''}!`, 'success');

    if (profile?.role === 'service_provider') {
      navigate('/lucid/dashboard');
    } else {
      navigate('/lucid/');
    }

    setLoading(false);
  };

  const handleResendConfirmation = async () => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: formData.email,
      options: { emailRedirectTo: `${window.location.origin}/lucid/signin` },
    });
    if (error) {
      showNotification(error.message, 'error');
    } else {
      showNotification('Confirmation email resent. Please check your inbox.', 'success');
    }
  };

  const handleGoogleSignin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/lucid/` },
    });
    if (error) showNotification(error.message, 'error');
  };

  const handleFacebookSignin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/lucid/` },
    });
    if (error) showNotification(error.message, 'error');
  };

  const PasswordToggle = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-gray-500 hover:text-gray-700 transition-colors"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-300">
      <div
        className="hero flex-1 w-full"
        style={{
          backgroundImage: `url(${BackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="items-center text-center">
          <h1 className="text-black font-semibold text-3xl my-10">
            Sign in to your account
          </h1>

          <div className="flex justify-center px-4 mb-14 mt-6">
            <div className="w-full min-w-96 max-w-[26rem] bg-white rounded-lg shadow-2xl p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                />

                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  endIcon={<PasswordToggle />}
                />

                {/* Account Type */}
                <div>
                  <label className="text-left block font-medium text-gray-700 mb-2">
                    Account Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="client"
                        checked={formData.role === 'client'}
                        onChange={handleChange}
                        className="bg-white accent-blue-600 w-4 h-4"
                      />
                      <span className="text-black font-medium">Client</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="service_provider"
                        checked={formData.role === 'service_provider'}
                        onChange={handleChange}
                        className="bg-white accent-blue-600 w-4 h-4"
                      />
                      <span className="text-black font-medium">Service Provider</span>
                    </label>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
                  Sign In
                </Button>

                {showResend && (
                  <p className="text-sm text-center text-gray-600">
                    Didn't receive a verification email?{' '}
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      className="text-blue-600 hover:underline"
                    >
                      Resend
                    </button>
                  </p>
                )}

                {/* OR Divider */}
                <div className="flex items-center my-6">
                  <div className="flex-1 border-t border-gray-300" />
                  <span className="px-4 text-gray-500 text-sm">OR</span>
                  <div className="flex-1 border-t border-gray-300" />
                </div>

                {/* Social Login Buttons */}
                <Button variant="outline" fullWidth onClick={handleGoogleSignin} type="button">
                  <svg aria-label="Google logo" width="17" height="17" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <g>
                      <path d="m0 0H512V512H0" fill="#fff" />
                      <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341" />
                      <path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57" />
                      <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73" />
                      <path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55" />
                    </g>
                  </svg>
                  Sign in with Google
                </Button>

                <Button variant="outline" fullWidth onClick={handleFacebookSignin} type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 256 256">
                    <path fill="#1877F2" d="M256 128C256 57.308 198.692 0 128 0C57.308 0 0 57.307 0 128c0 63.888 46.808 116.843 108 126.445V165H75.5v-37H108V99.8c0-32.08 19.11-49.8 48.347-49.8C170.352 50 185 52.5 185 52.5V84h-16.14C152.958 84 148 93.867 148 103.99V128h35.5l-5.675 37H148v89.445c61.192-9.602 108-62.556 108-126.445" />
                    <path fill="#FFF" d="m177.825 165l5.675-37H148v-24.01C148 93.866 152.959 84 168.86 84H185V52.5S170.352 50 156.347 50C127.11 50 108 67.72 108 99.8V128H75.5v37H108v89.445A128.959 128.959 0 0 0 128 256a128.9 128.9 0 0 0 20-1.555V165h29.825" />
                  </svg>
                  Sign in with Facebook
                </Button>
              </form>
            </div>
          </div>

          <div className="mb-6 mt-2 text-black">
            Don't have an account?
            <Link to="/lucid/signup" className="text-blue-700 hover:text-orange-600 ml-2">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
