# -*- coding: utf-8 -*-
import sys
import json
import time
import urllib.request
import urllib.parse
from base64 import b64encode

import os
base_dir = os.path.dirname(os.path.abspath(__file__))
if base_dir not in sys.path:
    sys.path.append(base_dir)

from dynapath import build_default_token_settings, generate_dynapath_token

def get_sid():
    try:
        from Crypto.Cipher import AES
        from Crypto.Util.Padding import pad
        key = b'2485dd54d9deaa36'
        cipher = AES.new(key, AES.MODE_CBC, key)
        plain = f'AD{int(time.time()*1000)}'.encode('utf-8')
        return b64encode(cipher.encrypt(pad(plain, 16))).decode('utf-8')
    except Exception:
        return ""

def search_trains(dep, arr, date, hour, trn_group="109"):
    token = generate_dynapath_token(build_default_token_settings())
    sid = get_sid()

    params = {
        'Device': 'AD',
        'Version': '250601003',
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

    query_str = urllib.parse.urlencode(params)
    url = f'https://smart.letskorail.com/classes/com.korail.mobile.seatMovie.ScheduleView?{query_str}'

    headers = {
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 14; SM-S928N Build/UP1A.231005.007)',
        'x-dynapath-m-token': token,
        'Accept': 'application/json',
    }

    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read().decode('utf-8', errors='replace')

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else "search"
    if cmd == "search":
        dep = sys.argv[2] if len(sys.argv) > 2 else "서울"
        arr = sys.argv[3] if len(sys.argv) > 3 else "부산"
        date = sys.argv[4] if len(sys.argv) > 4 else time.strftime("%Y%m%d")
        hour = sys.argv[5] if len(sys.argv) > 5 else "000000"
        trn_group = sys.argv[6] if len(sys.argv) > 6 else "109"
        res_json = search_trains(dep, arr, date, hour, trn_group)
        sys.stdout.buffer.write(res_json.encode('utf-8'))
