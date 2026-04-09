const axios = require("axios");
const PaytmChecksumLib = require("paytmchecksum");

const PaytmChecksum = PaytmChecksumLib.default || PaytmChecksumLib;

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
};

const generateChecksum = async (params) => {
  return PaytmChecksum.generateSignature(
    params,
    getRequiredEnv("PAYTM_MERCHANT_KEY")
  );
};

const verifyChecksum = async (params, checksum) => {
  return PaytmChecksum.verifySignature(
    params,
    getRequiredEnv("PAYTM_MERCHANT_KEY"),
    checksum
  );
};

const initiateRefund = async ({ orderId, txnId, amount, refundId }) => {
  const paytmParams = {
    MID: getRequiredEnv("PAYTM_MID"),
    ORDERID: orderId,
    TXNID: txnId,
    REFID: refundId,
    TXN_AMOUNT: amount.toString(),
  };

  const checksum = await PaytmChecksum.generateSignature(
    paytmParams,
    getRequiredEnv("PAYTM_MERCHANT_KEY")
  );

  const payload = {
    body: paytmParams,
    head: {
      signature: checksum,
    },
  };

  const response = await axios.post(
    "https://securegw-stage.paytm.in/refund/apply",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

module.exports = {
  generateChecksum,
  verifyChecksum,
  initiateRefund,
};
