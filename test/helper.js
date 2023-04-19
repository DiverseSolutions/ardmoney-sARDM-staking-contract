function parse(amount,decimal){
  return ethers.utils.parseUnits(amount.toString(),decimal)
}

function parse18(amount){
  return ethers.utils.parseUnits(amount.toString(),18)
}

function format(amount,decimal){
  return ethers.utils.formatUnits(amount.toString(),decimal)
}

function format18(amount){
  return ethers.utils.formatUnits(amount.toString(),18)
}

module.exports = {
  parse,
  parse18,
  format,
  format18,
};
