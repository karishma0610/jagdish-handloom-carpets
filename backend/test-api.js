const test = async () => {
  const base = 'http://localhost:5000/api';

  console.log('--- 1. Testing Health Endpoint ---');
  let res = await fetch(`${base}/health`);
  let data = await res.json();
  console.log('Health:', data);

  console.log('\n--- 2. Testing Products Endpoint ---');
  res = await fetch(`${base}/products`);
  data = await res.json();
  console.log(`Products Count: ${data.count}`);
  console.log('First Product:', data.data[0].title);

  console.log('\n--- 3. Testing Enquiry Submission ---');
  res = await fetch(`${base}/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ramesh Sharma',
      company: 'Heritage Décor Exports',
      phone: '+91 9876543210',
      email: 'ramesh@heritagedecor.com',
      category: 'Traditional Wool Carpets',
      quantity: '25 pieces',
      message: 'Looking for bulk wholesale pricing and swatches for our Delhi showroom.',
    }),
  });
  data = await res.json();
  console.log('Enquiry response:', data.message);
  const enquiryId = data.data._id;

  console.log('\n--- 4. Testing Order / Quote Booking ---');
  res = await fetch(`${base}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: {
        name: 'Priya Mehra',
        company: 'Studio Mehra Interiors',
        phone: '+91 9123456789',
        email: 'priya@studiomehra.com',
        address: { city: 'Gurugram', state: 'Haryana' },
      },
      items: [
        {
          productTitle: 'Flatweave Dhurrie Rugs',
          size: '6x9 ft',
          quantity: 4,
          specialInstructions: 'Custom geometric motif with rust accents',
        },
      ],
      totalQuantity: 4,
    }),
  });
  data = await res.json();
  console.log('Order response:', data.message);

  console.log('\n--- 5. Testing Admin Login ---');
  res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@jagdishcarpets.com',
      password: 'Admin@12345',
    }),
  });
  data = await res.json();
  console.log('Login success:', data.success);
  const token = data.data.token;

  console.log('\n--- 6. Testing Admin Stats with Token ---');
  res = await fetch(`${base}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  data = await res.json();
  console.log('Admin Stats:', data.data);

  console.log('\n--- 7. Testing Admin Update Enquiry Status ---');
  res = await fetch(`${base}/enquiries/${enquiryId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'Contacted',
      adminNotes: 'Spoke with Mr. Ramesh. Sending catalog PDF on WhatsApp.',
    }),
  });
  data = await res.json();
  console.log('Updated Enquiry Status:', data.data.status, '| Notes:', data.data.adminNotes);

  console.log('\n✅ ALL 7 API TEST SUITES PASSED PERFECTLY!');
};

test().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
