import React, { useState, ChangeEvent } from 'react';
import { signUp, confirmSignUp } from 'aws-amplify/auth';

// Define the component as a functional component with TypeScript
const AppAuthenticator: React.FC = () => {
    // State management with TypeScript typing for better type safety
    const [username, setUsername] = useState<string>(''); // User's unique identifier
    const [email, setEmail] = useState<string>(''); // User's email address
    const [userType, setUserType] = useState<string>(''); // Custom attribute for user role (e.g., developer, admin)
    const [password, setPassword] = useState<string>(''); // User's password
    const [confirmPassword, setConfirmPassword] = useState<string>(''); // Password confirmation
    const [isConfirming, setIsConfirming] = useState<boolean>(false); // Toggle between sign-up and confirmation views
    const [confirmationCode, setConfirmationCode] = useState<string>(''); // Code sent to user for verification
    const [error, setError] = useState<string>(''); // Error message for UI feedback
    const [loading, setLoading] = useState<boolean>(false); // Loading state for async operations

    // Generic handler for input changes to reduce repetitive code
    const handleChange =
        (setter: React.Dispatch<React.SetStateAction<string>>) =>
            (e: ChangeEvent<HTMLInputElement>) => {
                setter(e.target.value);
            };

    // Handle user sign-up with AWS Amplify Auth.signUp
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent form submission default behavior
        setError(''); // Reset any previous errors
        setLoading(true); // Indicate loading state

        // Validate password match before making API call
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // Attempt to sign up the user with Amplify Auth
            const user = await signUp({ username, password, options: { userAttributes: { email, 'custom:type': userType } } });
            console.log('Sign-up initiated for:', user); // Debug log
            setIsConfirming(true); // Switch to confirmation view
        } catch (err: any) {
            // Handle errors gracefully with fallback message
            setError(err.message || 'An error occurred during sign-up');
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    // Handle confirmation of sign-up with the verification code
    const handleConfirmSignUp = async (confirmationCode: any) => {
        setError(''); // Clear previous errors
        setLoading(true); // Indicate loading state

        try {
            // Confirm sign-up using the provided code
            await confirmSignUp(confirmationCode);
            alert('Sign-up confirmed! You can now log in.');
            // Optionally redirect or reset form here
            setUsername('');
            setEmail('');
            setUserType('');
            setPassword('');
            setConfirmPassword('');
            setConfirmationCode('');
            setIsConfirming(false); // Return to sign-up form
        } catch (err: any) {
            // Handle confirmation errors
            setError(err.message || 'Error confirming sign-up');
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    // Render the component with conditional UI based on confirmation state
    return (
        <div style={{ maxWidth: 400, margin: 'auto', padding: '20px' }}>
            {!isConfirming ? (
                // Sign-up form
                <form onSubmit={handleSignUp}>
                    <h2>Sign Up</h2>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={handleChange(setUsername)}
                        disabled={loading} // Disable input during loading
                        required // HTML5 validation
                        style={{ width: '100%', marginBottom: 8, padding: 8 }}
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={handleChange(setEmail)}
                        disabled={loading}
                        required
                        style={{ width: '100%', marginBottom: 8, padding: 8 }}
                    />
                    <input
                        type="text"
                        placeholder="User Type (developer, admin, agent, client)"
                        value={userType}
                        onChange={handleChange(setUserType)}
                        disabled={loading}
                        required
                        style={{ width: '100%', marginBottom: 8, padding: 8 }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={handleChange(setPassword)}
                        disabled={loading}
                        required
                        style={{ width: '100%', marginBottom: 8, padding: 8 }}
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={handleChange(setConfirmPassword)}
                        disabled={loading}
                        required
                        style={{ width: '100%', marginBottom: 8, padding: 8 }}
                    />
                    <button
                        type="submit"
                        disabled={loading} // Disable button during loading
                        style={{ width: '100%', padding: 10 }}
                    >
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>
            ) : (
                // Confirmation form
                <form onSubmit={handleConfirmSignUp}>
                    <h2>Confirm Sign Up</h2>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <input
                        type="text"
                        placeholder="Confirmation Code"
                        value={confirmationCode}
                        onChange={handleChange(setConfirmationCode)}
                        disabled={loading}
                        required
                        style={{ width: '100%', marginBottom: 8, padding: 8 }}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: 10 }}
                    >
                        {loading ? 'Confirming...' : 'Confirm'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default AppAuthenticator;