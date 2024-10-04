class MsgCode {
  static SUCCESS = "SUCC2001";
  static INVALID_INPUT = "ERR4001";
  static ENTRY_EXISTS = "ERR4002";
  static INVALID_STATE_CHANGE = "ERR4003";
  static NOT_FOUND = "ERR4004";
  static INVALID_CREDENTIALS = "ERR4005"; // do not have credentials
  static NOT_AUTHORIZED = "ERR4006"; // do not have access rights
  static INTERNAL = "ERR5001";
  static UNHANDLED = "ERR6001";
}

module.exports = MsgCode;
