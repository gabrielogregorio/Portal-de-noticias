function isValidNumber(value) {

  // Não é numérico, retorne false
  if (isNaN(value)) {
      return false
  }
  // Retorne o valor parseado
  return parseInt(value);
}


function isValidString(value) {
  // Valor indefinido
  if (value == undefined) {
      return false;
  }

  value = value.trim();

  if (!value) {
      return false
  }

  return value
}

module.exports = {isValidNumber, isValidString}
