#!/usr/bin/env python3
"""
Read JSON array of measurements from stdin and output JSON with derived fields.
Requires Python package `gsw` (TEOS-10).

Input item fields: id, pr (pressure dbar), t (°C), sp (practical salinity)
Output will include SA, CT, sigma_t when available.
"""
import sys
import json

try:
    import gsw
except Exception as e:
    print(json.dumps({"error": "no_gsw", "message": str(e)}))
    sys.exit(2)

def main():
    raw = json.load(sys.stdin)
    out = []
    for m in raw:
        try:
            pr = float(m.get('pr') or m.get('depth') or 0)
            t = float(m.get('t') or m.get('temperature') or 0)
            sp = float(m.get('sp') or m.get('salinity') or 0)
            # using zeros for lon/lat as placeholders
            SA = gsw.SA_from_SP(sp, pr, 0, 0)
            CT = gsw.CT_from_t(SA, t, pr)
            sigma_t = gsw.sigma0(SA, CT) if hasattr(gsw, 'sigma0') else gsw.density.sigma0(SA, CT)
            out.append({"id": m.get('id'), "SA": SA, "CT": CT, "sigma_t": sigma_t})
        except Exception as e:
            out.append({"id": m.get('id'), "error": str(e)})
    json.dump(out, sys.stdout)

if __name__ == '__main__':
    main()
