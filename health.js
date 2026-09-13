module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ success:false, error:'Método não permitido.' });
  return res.status(200).json({ success:true, service:'sqm-admin', api:true });
};
