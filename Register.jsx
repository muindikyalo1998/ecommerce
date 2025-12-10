import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
const Register = () => {
const [formData, setFormData] = useState({
name: '',
email: '',
password: '',
confirmPassword: '',
phone: '',
address: {
street: '',
city: '',
country: ''
}
});
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const { register } = useAuth();
const navigate = useNavigate();
const handleChange = (e) => {
const { name, value } = e.target;
if (name.includes('.')) {
const [parent, child] = name.split('.');
setFormData({
...formData,
[parent]: {
...formData[parent],
[child]: value
}
});
} else {
setFormData({
...formData,
[name]: value
});
}

};
const handleSubmit = async (e) => {
e.preventDefault();
setLoading(true);
setError('');
// Basic validation
if (formData.password !== formData.confirmPassword) {
setError('Passwords do not match');
setLoading(false);
return;
}
if (formData.password.length < 6) {
setError('Password must be at least 6 characters');
setLoading(false);
return;
}
const userData = {
name: formData.name,
email: formData.email,
password: formData.password,
phone: formData.phone,
address: formData.address
};
const result = await register(userData);
if (result.success) {
navigate('/products');
} else {
setError(result.message);
}
setLoading(false);
};

return (
<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6
lg:px-8">
<div className="max-w-md w-full space-y-8">
<div>
<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
Create your account
</h2>
</div>
<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
{error && (
<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 r
ounded">
{error}
</div>
)}
<div className="space-y-4">
<div>
<label htmlFor="name" className="sr-only">Full Name</label>
<input
id="name"
name="name"
type="text"
required
className="appearance-none rounded relative block w-full px-3 py-2 bo
rder border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring
-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
placeholder="Full Name"
value={formData.name}
onChange={handleChange}
/>
</div>
<div>
<label htmlFor="email" className="sr-only">Email address</label>
<input
id="email"
name="email"

type="email"
autoComplete="email"
required
className="appearance-none rounded relative block w-full px-3 py-2 bo
rder border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring
-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
placeholder="Email address"
value={formData.email}
onChange={handleChange}
/>
</div>
<div>
<label htmlFor="phone" className="sr-only">Phone Number</label>
<input
id="phone"
name="phone"
type="tel"
required
className="appearance-none rounded relative block w-full px-3 py-2 bo
rder border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring
-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
placeholder="Phone Number"
value={formData.phone}
onChange={handleChange}
/>
</div>
<div>
<label htmlFor="password" className="sr-only">Password</label>
<input
id="password"
name="password"
type="password"
required
className="appearance-none rounded relative block w-full px-3 py-2 bo
rder border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring
-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
placeholder="Password"

value={formData.password}
onChange={handleChange}
/>
</div>
<div>
<label htmlFor="confirmPassword" className="sr-only">Confirm Password</
label>
<input
id="confirmPassword"
name="confirmPassword"
type="password"
required
className="appearance-none rounded relative block w-full px-3 py-2 bo
rder border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring
-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
placeholder="Confirm Password"
value={formData.confirmPassword}
onChange={handleChange}
/>
</div>
<div className="grid grid-cols-3 gap-2">
<input
name="address.street"
type="text"
className="appearance-none rounded relative block w-full px-3 py-2 bo
rder border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring
-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
placeholder="Street"
value={formData.address.street}
onChange={handleChange}
/>
<input
name="address.city"
type="text"
className="appearance-none rounded relative block w-full px-3 py-2 bo
rder border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring
-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"

placeholder="City"
value={formData.address.city}
onChange={handleChange}
/>
<input
name="address.country"
type="text"
className="appearance-none rounded relative block w-full px-3 py-2 bo
rder border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring
-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
placeholder="Country"
value={formData.address.country}
onChange={handleChange}
/>
</div>
</div>
<div>
<button
type="submit"
disabled={loading}
className="group relative w-full flex justify-center py-2 px-4 border b
order-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue
-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled
:opacity-50"
>
{loading ? 'Creating account...' : 'Sign up'}
</button>
</div>
<div className="text-center">
<Link
to="/login"
className="font-medium text-blue-600 hover:text-blue-500"
>
Already have an account? Sign in
</Link>
</div>
</form>

</div>
</div>
);
};
export default Register;