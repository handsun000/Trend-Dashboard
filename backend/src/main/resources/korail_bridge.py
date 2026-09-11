# -*- coding: utf-8 -*-
"""
코레일 100% 실서버 라이브 모바일 통신 브릿지 (Python Engine)
- 철도 운영사 4대 방어 기제 준수 (WAF/Rate Limiting, Dalvik UA, 패킷 암호화, DynaPath 토큰, 2-Step 정규 트랜잭션)
- 지원 커맨드: search, login, session, reserve, waitlist
"""

import os
import sys
import json
import time
import requests
from base64 import b64encode
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding

base_dir = os.path.dirname(os.path.abspath(__file__))
if base_dir not in sys.path:
    sys.path.append(base_dir)

from dynapath import build_default_token_settings, generate_dynapath_token

SESSION_FILE = os.path.join(base_dir, "korail_session.json")
BASE_URL = "https://smart.letskorail.com"
USER_AGENT = "Dalvik/2.1.0 (Linux; U; Android 15; Android)"
DEVICE = "AD"
VERSION = "250601003"
SID_KEY = b'2485dd54d9deaa36'

def get_sid() -> str:
    """코레일 모바일 Sid 생성 (AES-128-CBC 타임스탬프 암호화)"""
    try:
        padder = padding.PKCS7(128).padder()
        plain = f'AD{int(time.time() * 1000)}'.encode('utf-8')
        padded = padder.update(plain) + padder.finalize()
        cipher = Cipher(algorithms.AES(SID_KEY), modes.CBC(SID_KEY))
        encryptor = cipher.encryptor()
        encrypted = encryptor.update(padded) + encryptor.finalize()
        return b64encode(encrypted).decode('utf-8')
    except Exception as e:
        return ""

def encrypt_password(password: str, key_str: str) -> str:
    """코레일 모바일 공식 비밀번호 이중 암호화 (AES-128-CBC + Double Base64)"""
    key_bytes = key_str.encode('utf-8')
    iv_bytes = key_str[:16].encode('utf-8')
    padder = padding.PKCS7(128).padder()
    padded = padder.update(password.encode('utf-8')) + padder.finalize()
    cipher = Cipher(algorithms.AES(key_bytes), modes.CBC(iv_bytes))
    encryptor = cipher.encryptor()
    encrypted = encryptor.update(padded) + encryptor.finalize()
    first_b64 = b64encode(encrypted)
    return b64encode(first_b64).decode('utf-8')

def load_session() -> tuple[requests.Session, dict]:
    session = requests.Session()
    session_data = {}
    if os.path.exists(SESSION_FILE):
        try:
            with open(SESSION_FILE, "r", encoding="utf-8") as f:
                session_data = json.load(f)
            cookies = session_data.get("cookies", {})
            for name, val in cookies.items():
                session.cookies.set(name, val, domain="smart.letskorail.com")
        except Exception:
            session_data = {}
    return session, session_data

def save_session(session: requests.Session, session_data: dict):
    try:
        session_data["cookies"] = session.cookies.get_dict()
        with open(SESSION_FILE, "w", encoding="utf-8") as f:
            json.dump(session_data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        pass

def search_trains(dep: str, arr: str, date: str, hour: str, trn_group: str = "109") -> str:
    """실시간 열차 운행 및 좌석/예매대기 조회 (ScheduleView)"""
    session, _ = load_session()
    token = generate_dynapath_token(build_default_token_settings())
    sid = get_sid()

    params = {
        'Device': DEVICE,
        'Version': VERSION,
        'Sid': sid,
        'txtMenuId': '11',
        'radJobId': '1',
        'selGoTrain': trn_group,
        'txtTrnGpCd': trn_group,
        'txtGoStart': dep,
        'txtGoEnd': arr,
        'txtGoAbrdDt': date,
        'txtGoHour': hour,
        'txtPsgFlg_1': '1',
        'txtPsgFlg_2': '0',
        'txtPsgFlg_3': '0',
        'txtPsgFlg_4': '0',
        'txtPsgFlg_5': '0',
        'txtSeatAttCd_2': '000',
        'txtSeatAttCd_3': '000',
        'txtSeatAttCd_4': '015',
        'ebizCrossCheck': 'N',
        'srtCheckYn': 'N',
        'rtYn': 'N',
        'adjStnScdlOfrFlg': 'N',
        'qryDvCd': '1',
        'qryStNo': '0',
        'qryStTrnNo': '00000',
        'qryStTrnNo2': '',
        'pgPrCnt': '10',
    }

    headers = {
        'User-Agent': USER_AGENT,
        'x-dynapath-m-token': token,
        'Accept': 'application/json',
    }

    url = f"{BASE_URL}/classes/com.korail.mobile.seatMovie.ScheduleView"
    res = session.get(url, params=params, headers=headers, timeout=12)
    return res.text

def login(member_no: str, password: str) -> dict:
    """코레일 모바일 실서버 정규 로그인 (code.do 암호화 키 ➡️ login.Login)"""
    session = requests.Session()
    
    # 1. code.do 암호화 키 조회
    code_url = f"{BASE_URL}/classes/com.korail.mobile.common.code.do"
    code_res = session.post(
        code_url,
        data={'code': 'app.login.cphd', 'Device': DEVICE, 'Version': VERSION},
        headers={'User-Agent': USER_AGENT, 'Accept': 'application/json'},
        timeout=10
    ).json()

    cphd = code_res.get('app.login.cphd')
    if not cphd or not cphd.get('key'):
        return {
            "success": False,
            "message": code_res.get('h_msg_txt', '코레일 암호화 키(code.do) 조회에 실패했습니다.')
        }

    enc_key = cphd['key']
    enc_idx = cphd['idx']

    # 2. 비밀번호 암호화
    enc_pwd = encrypt_password(password, enc_key)

    # 3. login.Login 호출 (DynaPath 토큰, Sid, Dalvik UA 필수)
    token = generate_dynapath_token(build_default_token_settings())
    login_url = f"{BASE_URL}/classes/com.korail.mobile.login.Login"
    login_data = {
        'Device': DEVICE,
        'Version': VERSION,
        'Sid': get_sid(),
        'txtInputFlg': '2',
        'txtMemberNo': member_no,
        'txtPwd': enc_pwd,
        'idx': enc_idx,
        'Key': ''
    }
    headers = {
        'User-Agent': USER_AGENT,
        'x-dynapath-m-token': token,
        'Accept': 'application/json'
    }

    login_res = session.post(login_url, data=login_data, headers=headers, timeout=12)
    try:
        res_json = login_res.json()
    except Exception:
        return {
            "success": False,
            "message": f"코레일 실서버 응답 파싱 실패 (상태코드: {login_res.status_code})"
        }

    # 코레일 실서버는 비밀번호 불일치 시에도 strResult="SUCC"를 반환하되 Key가 비어있고 h_msg_cd="S034"를 반환함
    if res_json.get('strResult') == 'SUCC' and res_json.get('Key'):
        cust_name = res_json.get('strCustNm', '코레일 회원')
        cust_no = res_json.get('strCustNo', '')
        mb_crd_no = res_json.get('strMbCrdNo', member_no)
        mobile_key = res_json.get('Key', '')
        cp_no = res_json.get('strCpNo', '')

        session_data = {
            "loggedIn": True,
            "memberNo": mb_crd_no,
            "customerName": cust_name,
            "customerNo": cust_no,
            "key": mobile_key,
            "phoneNo": cp_no,
            "message": "코레일 실서버 로그인 성공"
        }
        save_session(session, session_data)

        return {
            "success": True,
            "loggedIn": True,
            "memberNo": mb_crd_no,
            "customerName": cust_name,
            "customerNo": cust_no,
            "key": mobile_key,
            "phoneNo": cp_no,
            "message": "코레일 실서버 로그인 성공"
        }
    else:
        err_msg = res_json.get('h_msg_txt', res_json.get('errMsg', '코레일 로그인 실패'))
        err_code = res_json.get('h_msg_cd', '')
        return {
            "success": False,
            "loggedIn": False,
            "message": f"[{err_code}] {err_msg}" if err_code else err_msg
        }

def get_current_session() -> dict:
    """현재 저장된 코레일 세션 정보 반환"""
    _, data = load_session()
    if data.get("loggedIn"):
        return {
            "success": True,
            "loggedIn": True,
            "memberNo": data.get("memberNo", ""),
            "customerName": data.get("customerName", "회원"),
            "customerNo": data.get("customerNo", ""),
            "key": data.get("key", ""),
            "phoneNo": data.get("phoneNo", ""),
            "message": "로그인 세션 활성"
        }
    return {
        "success": False,
        "loggedIn": False,
        "message": "저장된 로그인 세션이 없습니다."
    }

def reserve_seat(train_data: dict, seat_type: str = "1") -> dict:
    """1101 일반/특실 즉시 좌석 예약"""
    session, session_data = load_session()
    if not session_data.get("loggedIn") or not session_data.get("key"):
        return {
            "success": False,
            "message": "로그인 세션이 없습니다. 먼저 코레일 실서버 로그인을 완료해 주세요."
        }

    token = generate_dynapath_token(build_default_token_settings())
    url = f"{BASE_URL}/classes/com.korail.mobile.certification.TicketReservation"

    params = {
        'Device': DEVICE,
        'Version': VERSION,
        'Sid': get_sid(),
        'Key': session_data.get('key', ''),
        'txtJobId': '1101',
        'txtTotPsgCnt': '1',
        'txtSeatAttCd1': '000',
        'txtSeatAttCd2': '000',
        'txtSeatAttCd3': '000',
        'txtSeatAttCd4': '015',
        'txtSeatAttCd5': '000',
        'hidFreeFlg': 'N',
        'txtStndFlg': 'N',
        'txtMenuId': '11',
        'txtSrcarCnt': '0',
        'txtJrnyCnt': '1',
        'txtJrnySqno1': '001',
        'txtJrnyTpCd1': '11',
        'txtDptDt1': train_data.get('departureDate', ''),
        'txtDptRsStnCd1': train_data.get('departureStationCode', ''),
        'txtDptTm1': train_data.get('departureTimeRaw', ''),
        'txtArvRsStnCd1': train_data.get('arrivalStationCode', ''),
        'txtTrnNo1': train_data.get('trainNo', ''),
        'txtRunDt1': train_data.get('runDate', train_data.get('departureDate', '')),
        'txtTrnClsfCd1': train_data.get('trainClassCode', '00'),
        'txtPsrmClCd1': '2' if seat_type == '2' else '1',
        'txtTrnGpCd1': train_data.get('trainGroupCode', '100'),
        'txtPsgTpCd1': '1',
        'txtDiscKndCd1': '000',
        'txtCompaCnt1': '1'
    }

    headers = {
        'User-Agent': USER_AGENT,
        'x-dynapath-m-token': token,
        'Accept': 'application/json'
    }

    res = session.post(url, data=params, headers=headers, timeout=12)
    save_session(session, session_data)

    try:
        json_res = res.json()
    except Exception:
        return {
            "success": False,
            "message": f"예약 응답 파싱 실패 (상태코드: {res.status_code})"
        }

    if json_res.get('strResult') == 'SUCC':
        pnr_no = json_res.get('h_pnr_no', json_res.get('txtPnrNo', ''))
        limit_date = json_res.get('h_ntisu_lmt_dt', '')
        limit_time = json_res.get('h_ntisu_lmt_tm', '')
        return {
            "success": True,
            "reservationType": "RESERVATION",
            "pnrNo": pnr_no,
            "limitDate": limit_date,
            "limitTime": limit_time,
            "message": f"🎉 취소표 예약 성공! 결제기한: {limit_date} {limit_time} (PNR: {pnr_no})"
        }
    else:
        err_msg = json_res.get('h_msg_txt', json_res.get('errMsg', '좌석 예약 실패'))
        err_code = json_res.get('h_msg_cd', '')
        if err_code == 'P058' or '로그아웃' in err_msg:
            session_data["loggedIn"] = False
            session_data["message"] = f"세션 만료: [{err_code}] {err_msg}"
            save_session(session, session_data)
        return {
            "success": False,
            "message": f"[{err_code}] {err_msg}" if err_code else err_msg
        }


def reserve_waitlist(train_data: dict, phone_no: str = "", include_special: str = "N") -> dict:
    """1102 예매대기 가신청 ➡️ ReservationWait 2단계 정규 등록 (특실포함, SMS안내)"""
    session, session_data = load_session()
    if not session_data.get("loggedIn") or not session_data.get("key"):
        return {
            "success": False,
            "message": "로그인 세션이 없습니다. 먼저 코레일 실서버 로그인을 완료해 주세요."
        }

    # 전화번호 결정
    target_phone = phone_no or session_data.get("phoneNo", "")
    if target_phone:
        target_phone = "".join(filter(str.isdigit, target_phone))

    # [1단계] TicketReservation (txtJobId: 1102)
    token1 = generate_dynapath_token(build_default_token_settings())
    url1 = f"{BASE_URL}/classes/com.korail.mobile.certification.TicketReservation"

    dpt_dt = train_data.get('departureDate', '')
    run_dt = train_data.get('runDate', '') or dpt_dt
    dpt_tm = train_data.get('departureTimeRaw', '')
    if not dpt_tm and train_data.get('departureTime'):
        dpt_tm = train_data.get('departureTime', '').replace(':', '') + '00'

    params1 = {
        'Device': DEVICE,
        'Version': VERSION,
        'Sid': get_sid(),
        'Key': session_data.get('key', ''),
        'txtJobId': '1102',
        'txtTotPsgCnt': '1',
        'txtSeatAttCd1': '000',
        'txtSeatAttCd2': '000',
        'txtSeatAttCd3': '000',
        'txtSeatAttCd4': '015',
        'txtSeatAttCd5': '000',
        'hidFreeFlg': 'N',
        'txtStndFlg': 'N',
        'txtMenuId': '11',
        'txtSrcarCnt': '0',
        'txtJrnyCnt': '1',
        'txtJrnySqno1': '001',
        'txtJrnyTpCd1': '11',
        'txtDptDt1': dpt_dt,
        'txtDptRsStnCd1': train_data.get('departureStationCode', ''),
        'txtDptTm1': dpt_tm,
        'txtArvRsStnCd1': train_data.get('arrivalStationCode', ''),
        'txtTrnNo1': train_data.get('trainNo', ''),
        'txtRunDt1': run_dt,
        'txtTrnClsfCd1': train_data.get('trainClassCode', '00'),
        'txtPsrmClCd1': '1',  # 예매대기 1단계는 일반실 기본
        'txtTrnGpCd1': train_data.get('trainGroupCode', '100'),
        'txtPsgTpCd1': '1',
        'txtDiscKndCd1': '000',
        'txtCompaCnt1': '1'
    }

    headers1 = {
        'User-Agent': USER_AGENT,
        'x-dynapath-m-token': token1,
        'Accept': 'application/json'
    }

    res1 = session.post(url1, data=params1, headers=headers1, timeout=12)
    save_session(session, session_data)

    try:
        json1 = res1.json()
    except Exception:
        return {
            "success": False,
            "message": f"예매대기 1단계 응답 파싱 실패 (상태코드: {res1.status_code})"
        }

    if json1.get('strResult') != 'SUCC':
        err_msg = json1.get('h_msg_txt', json1.get('errMsg', '예매대기 접수 실패'))
        err_code = json1.get('h_msg_cd', '')
        if err_code == 'P058' or '로그아웃' in err_msg:
            session_data["loggedIn"] = False
            session_data["message"] = f"세션 만료: [{err_code}] {err_msg}"
            save_session(session, session_data)
        return {
            "success": False,
            "message": f"예매대기 1단계 접수 실패: [{err_code}] {err_msg}" if err_code else f"예매대기 1단계 실패: {err_msg}"
        }

    pnr_no = json1.get('h_pnr_no', json1.get('txtPnrNo', ''))
    if not pnr_no:
        return {
            "success": False,
            "message": "코레일 실서버에서 예매대기 PNR 접수번호가 채번되지 않았습니다."
        }

    # [2단계] ReservationWait 정식 등록 (ReservationWaitActivity 호환)
    token2 = generate_dynapath_token(build_default_token_settings())
    url2 = f"{BASE_URL}/classes/com.korail.mobile.reservationWait.ReservationWait"

    psrm_val = 'Y' if str(include_special).upper() in ['Y', 'TRUE', '1'] else 'N'
    params2 = {
        'Device': DEVICE,
        'Version': VERSION,
        'Sid': get_sid(),
        'Key': session_data.get('key', ''),
        'txtPnrNo': pnr_no,
        'txtPsrmClChgFlg': psrm_val,
        'txtSmsSndFlg': 'Y',
        'txtCpNo': target_phone,
    }

    headers2 = {
        'User-Agent': USER_AGENT,
        'x-dynapath-m-token': token2,
        'Accept': 'application/json'
    }

    res2 = session.post(url2, data=params2, headers=headers2, timeout=12)
    save_session(session, session_data)

    try:
        json2 = res2.json()
    except Exception:
        return {
            "success": True,
            "reservationType": "WAITLIST",
            "pnrNo": pnr_no,
            "message": f"🎉 예매대기 1단계 접수 완료(PNR: {pnr_no}). SMS 등록 응답 확인 필요."
        }

    if json2.get('strResult') == 'SUCC':
        success_msg = json2.get('h_msg_txt', '정상적으로 예매대기가 신청되었습니다.')
        return {
            "success": True,
            "reservationType": "WAITLIST",
            "pnrNo": pnr_no,
            "message": f"🎉 예매대기 최종 등록 완료! (접수번호: {pnr_no}, {success_msg})"
        }
    else:
        err_msg = json2.get('h_msg_txt', json2.get('errMsg', 'SMS 등록 실패'))
        err_code = json2.get('h_msg_cd', '')
        return {
            "success": False,
            "message": f"예매대기 2단계 등록 실패: [{err_code}] {err_msg}" if err_code else f"예매대기 2단계 등록 실패: {err_msg}"
        }

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else "session"

    if cmd == "search":
        dep = sys.argv[2] if len(sys.argv) > 2 else "서울"
        arr = sys.argv[3] if len(sys.argv) > 3 else "부산"
        date = sys.argv[4] if len(sys.argv) > 4 else time.strftime("%Y%m%d")
        hour = sys.argv[5] if len(sys.argv) > 5 else "000000"
        trn_group = sys.argv[6] if len(sys.argv) > 6 else "109"
        res_json = search_trains(dep, arr, date, hour, trn_group)
        sys.stdout.buffer.write(res_json.encode('utf-8'))

    elif cmd == "login":
        member_no = sys.argv[2] if len(sys.argv) > 2 else ""
        password = sys.argv[3] if len(sys.argv) > 3 else ""
        result = login(member_no, password)
        sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))

    elif cmd == "session":
        result = get_current_session()
        sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))

    elif cmd == "reserve":
        # sys.argv[2]: train json or base64, sys.argv[3]: seat_type (1 or 2)
        train_arg = sys.argv[2] if len(sys.argv) > 2 else ""
        seat_type = sys.argv[3] if len(sys.argv) > 3 else "1"
        train_dict = {}
        if train_arg:
            try:
                import base64
                decoded = base64.b64decode(train_arg).decode('utf-8')
                train_dict = json.loads(decoded)
            except Exception:
                try:
                    train_dict = json.loads(train_arg)
                except Exception:
                    train_dict = {}
        result = reserve_seat(train_dict, seat_type)
        sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))

    elif cmd == "waitlist":
        # sys.argv[2]: train json or base64, sys.argv[3]: phone_no, sys.argv[4]: include_special ("Y" or "N")
        train_arg = sys.argv[2] if len(sys.argv) > 2 else ""
        phone_no = sys.argv[3] if len(sys.argv) > 3 else ""
        include_special = sys.argv[4] if len(sys.argv) > 4 else "N"
        train_dict = {}
        if train_arg:
            try:
                import base64
                decoded = base64.b64decode(train_arg).decode('utf-8')
                train_dict = json.loads(decoded)
            except Exception:
                try:
                    train_dict = json.loads(train_arg)
                except Exception:
                    train_dict = {}
        result = reserve_waitlist(train_dict, phone_no, include_special)
        sys.stdout.buffer.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
