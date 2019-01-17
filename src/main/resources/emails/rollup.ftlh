<html>
<style type="text/css">
body {
	font-family: Arial, Helvetica, SourceSansPro-Regular;
	color: #000000;
	font-size: 11px
}
h2 {
	font-size: 22px;
	text-decoration: underline;
}
h3 {
	font-size: 16px;
}

a {
	color:#0072BD;
}


.tallyTable tr th {
	background-color:#cccccc;
	border-bottom: 1px solid black;
	border-right: 1px solid black;
	padding:4px;
}

.tallyTable tr td {
	border-bottom: 1px solid black;
	border-right: 1px solid black;
	padding:2px;
}
</style>
<body>

<!-- all images are being commented out until they can be linked directly from the server -->

<!-- <h1><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXAAAABUCAYAAACbU2yrAAAAAXNSR0IArs4c6QAALnhJREFUeAHtfQd4FWX290nvCekESAiBhAAJHaT3DtIERF0sSPG/yn5SBV0Vda0LYsO2qMCiKyooiNKEEAMovUjvgUCAQEjv5Ttnbt5k7txpt+beZM7zTKa99dzJb86c9xQnqE167mAAlOb0BajsDZWVrcDJqSXum+GQXGpzWFrfGgc0DmgccAQOONl8kPOT2kN5xWQE6oHgBB2hEpxtPgatQ40DGgc0DtQBDtgGwBfsbgSlJY+AU+WjCNwJdYBv2hQ0Dmgc0DhQ6xywLoDPSYkDp5KFUAF/QzWJW63PVhuAxgGNAxoH6hAHrAPgC5JbQVnpy8inicaoSFxRmdLIGyDKzxnCvJ3Ax80JvF1pQ/jHxgrKKqGgFCC/tBJuFlTA1dxKSC8AqKCbGmkc0DigcaCeccCyAD7vmA9UZrwMFU7PqpG4gz0BOoY6Q+dwV+gY7g5NG7iBu6sLODs743qmk95Gv0tlZWX1VlFRAbQVl5XD5axSOHyrFA7cLIMjGRWQXVLPfkVtuhoHNA7USw5YDsDn7HwA0fU9hNkmcpwM8gAY0tQVRsZ4QEKYJ7i6unKbi4sL0EbgLQRwfnsMxAm86bi8vJwD8rKyMu64FPdH0otg06Ui2HGtHHI0MOezTzvWOKBxoA5xwHwAX3zQG3KyPkQdx1Q5vpCk/WgbT+gd5Q2e7m7g5uZWDdwE4gy4heBNkjifGICzPZPECcjZVlpaCrQVFJfAziuFsOpkEZy+p+lZ+HzUjjUOaBxwfA7oo6Ox85n7W2tUl3yHUncbqao9Ipxhelsf6NzYG9zd3Tng5oM3X+oWgjdrk4E4gTYjBuC0ZyBOewJxksbZVlJSArSlpObDir8KORULa0PbaxzQOKBxwJE5YDqAz9s5Bu25v8HJ47KjIUX7O8PCrt7QM8oHPDw8OPAmAOerTKSkbmqNgbZhy7orDMwZkDOVCgNxoTROIF5cXAzbLubCkoOFkJ5f8zKQ6kO7rnFA44DGAXvmgGkAPmfHdFRAf4ITM/CY9MArMxI94fF2fuDn7VUN3nypWwq4+aDNPxZjIANwusdAnO35EjmTxEmlwkA8O78IPjmcDatPlUC5huNi7NWuaRzQOOAAHDAewOfsfBEqK14VmxtJ3Uv6+UFChB94enpKSt0EzgTiRHTMwJrtxdqWu8bAnAE4lWUSOUnidExAznTjJIkXFRXBgWu5sCA5F00SNRSX468l7/njG75P8wYwIDYIMvJK4M0dqZZsXmtL40C94oBxAC4D3qNi3OClXoEQ5IeLlALw5uu5GWAzsGZ74npGbhGknE2H38+kw/Grd+FGVj7czCrkTAUJnF1d0D7c3wvCA7ygWag/dGgaAh2iQ6B7i3Dw8UBjcSQhmNM5k8j50jiBOG03s/LgheQsSE4r4+prfyzLAW83Z+jVrAH0jw2EAS0CoVOkP7g46x677MIyaPxKCuSXVFi2U621OsuBgfgcuSMOlKPzRzn+b3N7fHxqjtl1vIZlyvTK0T3ddfn6+uyjp5WeWRc8oL0rHbMNBVAcTtV93fWa+3idu19VXli/+h5AyqUsyC4q1+9YxZnuP0lFQZi7cwYi4WdiRZ/t6AUzOweBl5dOZUI6b1KZ8E0DpYB77/lbsHr3OQTtG3D6+j2x5hWvebi5wIDWjWFMp2iY3L0FBHi5SwI5W+RkKhWSxAsLC+GtPXdRpVKs2JdWQJ4DHviUd4sO4MCapOyuUf5o26/72hKrOX3taVix74bYLYtd64cS/3tj4yzWHoHFmC+OQ1q28c9LQz932DKjvcXGItbQBynX4Mv96dW3Nk9vDxH+7tXnjnCQXVQGfZcfNhjq9Zd7QaMAtEW2MlUg8Ffg70xAzRcyrdVt9/cPwJ+pOUY3rxNblarN3Tke1Sak89YjeiO90tMXJiYEcuDNJG8G3kzXzcCbKtMx/QOs23cR3t18HPZduKXXpiknxaXlsPnYVW6b+80f8HD3WJg3sh3ENQzgmqM+SRJn42DjYl8GtH++N0r3Ppmw5AC6dmpkNAe6RPrBmyNbQA8Eby93g6URyfZm9mhsdQAP9nGDdo39JMdgyo3PJsbDyBXHjK5KXySWHotwEAPxxckH8HaNfRHArQ96wnGYc15cJv5V5oX8swU5I3CjO6EtuuL6IEndFFIG8HlJCSh5rxG6xBN4LxsQAMNbNtADb7IyYcAo1HOTpvnj307CO5uOQuqdXFPGq1gnv6gU/pN0ClalnIXZw9vCP8d2At8q9QpVprHxgZyOaZy0n9HZGfzcM+HlPXmK/WgF9DmQjh5T/VFFQg++MdQZVSodEVwPX7fO80BjcaNvXAvTiNYhMKVTQ/jvoZtGtWyNsQgH0CrcR++Sm5G/iV7lWjqReopIIq6LVIoSvykk/2STa3xFxfcovnoJG3+1lx+MiA8Eb2/vatWJ0NKED46XM3Kh/+sb4emVKVYDb/4YS9DF/u2fj0D8/G9hLUr7/LEQYBOQ08uGTBtJ5UPqH5rLw+2CYV4X/X8AfrvasTgHSJ2QdME0FRhJ4dYk0klag5ahWibM17gYbW4k+ViRNp28A+O+Oq7Xgy1eGnodWuAkB1UoYlRaR83GpL44xHjAvyb/rdtt4pcI3gP4FeiYAO7xjiGi4M2kWQJM2og+TzoN45ZtgfM3s7lzpT8RgT4wKKEJ9G7ZCPq1bgRDEiPh/o7RMDChMbSNCoZoXMAkuptXXK3rlmozt7AEfth/iVsYHdYuCnw9a/7h2BjZmNm+XZgb5GG9o7fFHyKpvur7dWf8vccmhhrNhpZh3vDR7jQosdI/py9avjQN9ARfVO34kJ2rhcgb24vGdr8/dlt1i7QAF4NBgIhXDbzQA7nqf0R1AxIFUzMLYeq3p+GlLZdwMUz/uY0N9eYW83zcncET14scgW7llsD7qMsX0rN9I8GP90UtvO+o50uSrsI9XNQ3lqRVKLN/o6QLfxM2OC7WE2Z2CZFUmzDQpn0R6qYnf/QbbDh0WdiM3rm/tztM7Noc+sRHQK+WERATqk5fWYjtJ5++AV/vPQ8/HbwMeag+kaKkU9ehx+IfYctzIyE2XKcbp7IMtPn1SF++qHcoXMpKR+sU6Tb5dbRjgHBcoDOFSMX1SMeG8Okf102prlhn75VsGPzpEa4cScxtI3whEbfhrYJhcMtgxfpyBSa2D4exh2/BTycy5IpV36MvlXFf/cWdu6M0HhviDa0b+gCpPVrj1ircG9o2Uvf8UyOX7hbCm79dgVUH0kHqM/xJXChmFIrrAQTocbi9OKQZvkwMPq5Z0Vrd5xaLg1ldlcCl5qv0I4h/zy3+0x+y885g5Qh+Ay0auMC6CREQHOBbrTbh67yZREt1CkrKYMy7W+C3E2n8JvSO4yIawKwhCfB4n3g9PbVeIZUn1N/Gw6mwGnXftKApRaFohvjLvBHQJSa0WnpnpoZkoULWKWReSJYpNzJzYcz3N+FmvviCilQf9fE6PUgXXuhhMiAcRR14h6X7bcq6Se3CYO1jiWb3mZ5TDK3f+hOyBJKvqQ1XLB1Q/fUq18Y/f70Ib+9M5aRruXJS95L+3hH64bqFPdJuNKvr/dEhg6GdW9SdewEZ3FC4kF9cDjdzi4Ek+5u40T7M1x0ewGfAFDqRngfbz2UCWRXRRsJLQz8PCMIXpCnkPm+n5AtYrj1xCTwn7zWspAfeXhiX+4OhIRDIs/OWAu88fHuOWvIrJx2Ldd4cJeD3p/SEEe2jLLbO6+3uCpO7Nee2JJTKZ63aDSfTMg26z8gphP5vbITvZg2GEahSYdYpJIkzomu0RQRWwrJBQfC3jXc4+1F2X9sbcmBIyyCTwZtaa48LmWRyuP+q8aZUhqOx7RWy8Hh3TCxM5Um6thjBnstZJoO3ueP78fhtjM1fAYGoBgrydoNADNof6KXbW0LnLiWRSunGhfPZeuYuvLrtchVgF4v6GkxoG2YygJ+8mQ9zNpwXdos26k7ci4FAfRJ+nc0f0NSgjPAC4aXU15OwrPDcEMDn7GyHJoNPCwvO6uSLn3o1HpZy4D3s7V9gz7kaO1TWFlkoPDusLbw2oQsQ4FqL+rdqBEffmAgfbvsLFq8/CDkF+jFlyVJl7LKtkPzP0ZwTEBsHfUEQkNNiLJPKuzUNgMcSCuDLvzTzQsYnsf1TFliIfKp7Y4cEcOLHE/c1gv8ducVJZWL8scY1Ew0XLDKUZcnXIAVfIGJEaw0E6BywVwO8G3Rv6g9PdmssVsXgWi5KzGKUSRldVNABFARIdWZronUcUpPRFogvNjUAfjdf3ZzE5lIjdlbfrVyMh3orHXFBrvBkp+BqD0sG3kxlQntGz6xKEQXvFmiTvfflcbD04e5WBW82DrI8mI0vizPvTIYuzQ0/k0rRSmXSh9vhTl4Rq1JtqUIWKgTiZJ1Ctu3Pdg+BCF89llTX0Q4AGqNjxSg0qzOXHuwQDgGejsvnzyfFAy0U2orI0cQeKa+kHK5lFcOxG3mw62IWrP8rA75AZ62lu6RVm8J5ZEks6KkFu+sIoLVNaVk12CI3lgyLATjZfKOTmbCzV/oEgY+XLrYJ30mHD9xU59s/L8Kq388Kq3Pu7gTe94kAqUFhC1+IaOANSc+PhuGoLhFS2t08mPLJTi5dG/9lRFI438ww0NcL/tmzgbC6dl7FgWkofVKYA3OJrDqmdNbT3JnbpE3rRwd5cc5Mtuq0NiVwU+Z4/g6FxVC3nnThjvgXb2aB+OKmcDz2AOBqx0D6eFNJ/7+uouJ5jCZSI05jqwObenCfPnz3eGa5wUCPOk9FMHzqy98NxtEbLUt2vTAGQv0wf1otEcVJ2Th3OLdYKhzCFlzwfH2DzmWXzYf2NEf60mCS+Ah0WOoQbtoChbDPunROZs3TujWy2JRmohrFkenpnk04b1RbzIHieTgSUVyS07fyVQ35FOqYxYgWItVQWrY66VdNW6aWyUE1EOm3lcgyAD53R1NU/E4SdvZMVwweU5WIgaRS2vgATuXpOXpk+Q7ILtBnLtlyb31uFPjj4kZtE6lUvprRD54enGAwlMXrDsK+izpbXgbiNEchiD/dWZPChcwbiaqTJg0s93JOQPO+nuiO76hE6zwrHmwFFBPG2mSvKhS5ef+F1htqSAroL2eqA2a10q+asZhTJg1VSUpkzlhrJPAKmIId6Skge0d6cG7OLBEDgTcDONozWnfgkoHeOyrED9aipYeXnTkOvIfWLz3iGrKhc/tyDDc79+s/qq+xuRGAM1UKSeKDWgRAm5DafxlVD9QODiyxeCmchrU9M4X9WfqcbLpfHhpj6WYN2nMwAZwbvxoAL0Qd+pV74kB9Ge3elagE1TQZeaYvDCq1b8x9NeCsVlcu1m8NgEPlo8IC0zs24KRvtmjJJG9huTc36kcNc8PM8mSmF+RjfwF0SBJf+8xgCPHTd2Agq5n16AzEiL2o+FI4vciebK/zAmXl6vOevBCHmukII8a/iWibS+Zpjkzz+0dBBwwiZU2qqxL42YwC7qtejHeX0eNUiW6gXb69KJfUADgt+JpKOgCfk9QNG4jlN9LQxxn6NPPndMAE4Ay8GbCxspuPX4MjV+6wU26/BC1NamPBUm8QMidNgnxgzd8HGjhLvP3z0epabJ60Z5I4SeEjWgagS3bN10d1hXp4MAP11cYGr1LDJnL3fqxLhJqidluGFnW/eLA1FzvaWoN0TAlcXLfN55GU+oTKUNC0XAWHKTWgye/PmsdqdPHkTWsq6QC8ssJA9z0mzhfcEbCE0jcBGp/eqFoAZNfIZO8f6F1p7zQ0sQnMHNBab5j7L96CPy/ox7XgAzjxws/LA4bFeOvVq48nFOFu6n3yIEu29FdUSExi/HP0xUyaU4cmfkCSuLEk/B+Tqu+IEjiB63mUsG+j5YXUdihNOjIlSdZHb0jfJ16p0TtL8dTS15VeJhR3XM1XhdS42HfqQGGBCW0CFMH7MEreuzGDDp/+NaEr/1TxeMPhK7D012OcFE8eXBQL5aVxnaBzM+ODIil2Jijw/JiO8GXyGaDIhYw+23kKurUI407ZP5IQxMe38ocfzihLEqzNurgfh0GrwtF1WI4oy8gPGOjpg/Et5YqJ3otHPXJfTMSQjHbEjkykC19/PANILaCW6MXHnj25Orh045AU9+YfZo37SFoe9I6RDgGgBJpmdW5kZaWXCUnf5gRxc4ZFvxNS6gWEIKeV+DDvagCnh4lt/PFvQfUJn/rEU+TAJvxLssfPfbsPxmK8lBRMoUaBqO7lF8PPCOg9XvkJ1uw5L1vXEjcjUZXyeB99cNmI/ZO5E5+EAN4tyhe83fS/RPjl68OxmsXLrzArDHknlpabhjR1QQr3wGxEX0xuhVEHLf9UOKIEbgku/JGajaqUYsntnBEvS0uMR66NVFyMlRurud6irlBc2k9o+92jiWc1eJP+l+m/hQPdLghU9drELsIikuckeb+zSRchTliIvCRnok15V1THsKw6wjKWOl80ugN8hc5H1CdRJnpm7sJYKoPa6OyRCbyZRMR04Z7ubtAlwgOSr4qvlFtqbPbaTkuMZNcfs77IEQUPIumbvPJ+OXUHw8zqvmrk6gjvjcdYFSE+5+COGZ5qwjaNPc/EvumTndLDmUo9MSco2Yd/iCFzLUkCOcOSTdt1W9+iUECbIxB5ozZavNtqQ0UdeGUvYes9o3z07L2F9+k8Hw3U956ryUZCAar6oPpDLZHaRI4KiksRWM/IFbHIvWg0d3wQg2DxiULP8ol9fTAAJ9NC4lF9JTVmfj9gsCMCb6JVB2qeE2N4RtLrE13VP1PGtK22LEWX+8f6c6ocMuTafGNkcy4muVwZY+9RakKN6jcHnNHxMl7Igq5N9AGcARi/XDImIebrjsd2iubfVjwWWq6IVdh91rR/fLG25K6N7hitd5s59bCLbP60ZyDetUn9XMj0RFB9TIW7+8r9NYmKSQJXG8OC8Zztp2PwIytoH1jzqvakUlvw8wVVZaUKUcxzipViSaIFMI3qNwcob6eeEtgDw8ZS9hICKtoYeAnZRGoGPo3t3Ix/qnhsiZCTip2oLEAZ7fnmcAcu6VuiUDOMD7QnCTwuxEtl63Wr2KT2YYoxj8nZgr/4SKEyvzls2suYkg8MiJVesLIFd6Pw/+HTvdch6bxheGJj+h+CNvOW/KJwZPym5M7+FsyOZMzvUJfKuqLFu56dU3QAmg6iNYgceBMDTl2/V80HSpLQI7Zh9bmaA7I2oQVLOTp0OQNe+fEQLBjV3qoencG+HtC+aQgcxv6IKPxsJi6oCh2R+CBO6bCCvVzgbmGNBYvcXOrKvad6KC9SU3YYoWxI12b1jjSJDbRguuN8zfNmUiNmVIps4MHNhzLbHJ9/n1nJR5aOjoXNp+9ySQXMGBJX1Z4WMRt4ukIoZjsKxSQJlPUnpGrPndN1H3e8RntdGQpctiQpFeab+WVjLg8dvT6aEeoHr4oJdDOQvgm4hHQNg1cx6k8SrGERdlt0/yJmiycrFrZ4KFaoELPsLF53gDP1+/dD3WDSffq6arE6pl4bjHFbGIBTGzQ/PoAzHtCeqVGIV/UJwCkVWXeFOCW04Lv6YLrBz0C2vSdv5kGbhsZ7J45JQJNFBIRbeaZHbTMYkBEXSAInojgcpEr5eILpqhCKEf3xAy1h/EpdWjUjhmFQtDYl8A/Gx4EL/i8QaAcjKNvTF7UBo+rwBZ4rvW6WDfEHUZK+qWR6Vo1da6tGxgd5opRm/3myL3iKJHYID/CG7Yvuh+WP94ZgjGJ49U4uPIixu/v8awMcSb2r93NQtvvZX++FwW9tgg4v/ACPf54EB6skab2CCifCL4ib2YbeUXwJnI7DfZkZvULjdeS2GtNBUp1IBRwiKdwUInBQchoypV21dSJ5wbosoUoZh9Y1FC7AXKpNCZwyKCU28oWGmI1IA29zf0nT6xsAOAWkZwAu12w2L8tNfCPTdJSP9Y6DI69PgFlDEzkHHpLkX0QnnuNvTuLM+P4+qA2cX/owd5/UOmQv3vnFH2D6F8lwO6cIkvE8cdF38N7m41zuzaOpd7h45F1fWg/LthyXG77BvagQfclQynaZgTjxyNeGwfsNBmzjC/RcPNJJWU32FW/xUjjENQdvgqkhUGtzMZNJ4DQfUg2RKoXMJM2hD1GCDcKsNeZQbUrg5oxbq2s5Dhg8QQRKDKTYXqw7/qJfGOrATaV4TGz8AUYIlKJAzFhP959Ct3eStLeh2mVF0mn4bt9FDgwoPZqQ6DN+zpq90DYyGAZW2XMLywjPKT4Kn+RW+Blf6hOAU9Z4f9RzyhHFPl6H5oNSlI7u09vPZsIwzAZvLDXD7OmUd3Mr1rc1RfEkcOqbU6VsOg/LHzBdlUJerO+NjYNHvzllMJ2CkgrwUbHAZ+rL0KBD7YLDcsBAAqd8dmrImacXt0W879aNA2HrgpFcYgZKz0YLjWLgzR/7v3+pCU7Fvy527OOhHybWDc3lhMSAm/ZEPip5JWzHEc/V2H5/f/S2aPJY/nxXiejH+ffljtWocOTqm3qPFjGF9Mme67DrgnkLq5R9aHi84ctMTQAkGk9tqlCE/NDOa4cDBihVpjIOQyAvVKyvpz74WXMq93doCifffhBaIaArkTAwlVx5/guJyjUO1JfIhXUJxIUu98IydeW8S6QfdGyiHEZ3pQod90+YHzFbIt+hEr8o72Yjf3elYha/74UvamF+BlKlTP32lNmqlM8mxoOfQNpWG15UU6FY/Kd2uAYNADy/RGcAxqRMqRnxAa5ARdogqXZMue6O+nD+C0SqDT8jMgGVCeJ1RAbr68TF+igoFRrLiZVy/GtqTAcvYg5DCl6lREUYbP+7o6a5QdM6yJOYf9NeiFQpz20yz8EnEi1c3h7VQm9KagP8axK4Htvq5YmBUjMP9W9qKDLYB/Zf1JXMKbSteRdZoty4V2MFIzVeY+Ko3MiqiS7og18UpHtXIrW8UmrHnu9TlvjJmC1eicRsv6XqUNnpJua+nIaema//dkUy4L9Un9a6/vGeNJiAFiX9Wih/EUqNgVRDFNvj96oXoCNI4GO+OAbHMc4HqRFJX8/tcf1Mt2fnVfvq+3ReU8aeogZK/Tb2ft0AwHOrAJwWAuWoXVQIrNt/iSuSU2i4kChX19R7dzDQ1Avf7YcVu06D3CIja3/WEL0gi+yy6D4tswbAYzGuixqipKV1nR5FPS05XciRzvZbvaflnivZcAEjxrVAL0tjiSxCRuAi6KZT+uakxrZjqfL0X/IkqlKOz++mauFRrF/62qU8mu2W7IPC0gqMZ60uSFptSuD3MDu8VNozsTlq16zDAQMAT80q4aLvKXXXGe24GeUWmS6Bn7+VDV/sOgMXcE+qmO7o0fnUwNZ6WezJpG/59pPolXkQstBDkmgAWpcMSYyExesPQhE6/Ahp0eiOYEx8Fr5jUr/W8p/pBFi0pWbZ5sUlnJstz9UsHFKew2B0UKFNLZG6xRQAp/Zndm9iNwBO47lUpUr5CB10TCUKGfDK0BhYgCoZR5DATZ2nVs+yHHBFm8FCRKNqO8CLmZhPrgqg5Lrq1iKcc7kn3fH1ezXSq1wd4b3Vu8/BtBXJet6Ym49dhffQhnvj3GHQE8GcUrbNXrMHzt7Q6VdjwvyBUraNq4q9Qoua/8KsQHswMqI3OgXFooUKvQBGtNOLECDs2uCcH8BqYBtxd3E+X0j6uYwvu7pMvTEMamsVnpNtG/nBobldbcaK4SiBk2WIWqCzxcBIlULOOX3NUKXM6RfFrQ9cUyuBa6uYtvhp7boPksDP4daOjfJGbhmagpWDJ3oPM8ASW9AkHXFPzO6ejEGtfkeHmgUj27MmVO3JQmTq57vQlttQ504xuUct2czl1dxalTSCLF0og86c4e2AwowyIvPCbzC/pbnEgnPRQplSWFziC4FHcZm8msncMdV2fTXSd22M0QXjNpBjz0tbdCq82hiDsE96EsgqxRxVCs3ry8mtYeAnh4XNi55r+C3Klnp1EcPJwlnhjE/dKqgGb+E9/vnYTroIhBT21diH6a2fj4iCN2ufVCUE3vTyeAyz5pxb8hAsur+DHnizsubuyavzVJrOQYRUM3J27eyldvKWoau9ueOwp/ohGN/iAQu4e1trTlMxTrjQtM9afaltl1QpC38xzyqF3NP/D5M/kFOUEmnxwJU4VPfvowoFjiOIT+JPdXdqHvSI0WUgIcCSIkpH9hIGm8ouKMYYJXegU3SIVFGD639dU16EoiiHm+YNh64xYQb1LXlh/cEaSe7pQeIJmRlws/3u1FxLDsHu2qKwp/wvHXsbYGP0jry/TSj8dEIXQdJexrccs+5MaGueKuWFQdGYJ9Hwy1Q4R2OFJmH92jyncLL7nu0COZhhnjIuZWCgsgzcs2Pa78PUaXdxsVQjaQ6QCiVJeDvlSh7M5+nBCbTE1CgNUI0yvX8reBez61AWG2MAnCxKlKhdVLDVwZvG8NmOU9xQojA7z8gOUZLDYuBdgWqf3amm6f0lG7ejG+RnOgNVFPZOlDPT3gCcxB0WdlbJekeKv+6oIqRNjuhZdGQahh6oCRjdUo7GfXnc7n5fufHWxj1naBlwANMV1MSGxVHsS8uHotJyNNWrUFSlzB7WFtxcXTjTPmMeqYQmyjkG1Xhbmsu0/Zi8gYJgEVHwLAqRKUbsH4b2JB2cvK38AhJrxxGuDYoLMtlCxJbzo9go0VWhXm3Zr1JfFzGhxUIzHXyU+nBk6ZvmRrbzSiQVUE6pXn267wozO5fC7B0pOOnhbOJFuDi3HQPoj00M5wCcXRfbUxCoh7q3gNUpZzFBQyqM7thUrJjBtWcGJ+jl1BQWoGBZJN1bm976WRcvhTwvZw2RVp/QOAi86aW20U5skK3FG7WLl7vRFBANKs0eRutwXy6mtLEN0TMyA6Xw53+t8igztgErlv+IVCkIUn2am+7gIze82rQBlxuXmnseuHhBYRGUqKTc/GdLqQ9Hv6+zA3dy2oLoVA3gNKlvj2XCaNQxEmixTUyNQmVfQOuQ7zE6IAWPUgvgBPoUDvazHSepCT2ifj54tBckqpDS9SoaeUL9/3hAp/9e+kgPzgxRqgkG3gTga4+bF8RIqg97uB7h546/u/I/1x/ojNP7o0MWGfJcNJ9bgplqTCGKE/4yWqNQ2jZ7IhrN1G91GXxMVaXIzcfOpis3VIN7Q1F94qcQ2ZIqaRK4AesMLugUbc4e36KSW2+1YNuFHMgsKFWlRiGX9XcwY87us+lgTACpT5/oDWvQBHAwOuS4oxrGGyMCDsTMONsXjoKnUZ1hTaJ/ALIvJyLLk4ldYyS7Yy8wAu9L+HlMKqa6StO6NeLs+5Xm9+U+/ZyoSuXl7n99yPQ44RSWlTL22CNZU5WixhPZHnlCY3oAF3nVUKkmgSuySQfgS3reRjF7K780fb58cySjGsDpHgGZFJFKZBg6z/x95e9GvTkf6REL254bCQVfTYO8L56E3xC81cbwlhqLmutvbDwMR67cgSBfT1gxrZ9kFTZnJoGvOiQd71qyEQe5gRoJoFgjSlSAfgJrTQxIJdb2TYwTvu2sslWSWF26plblI1XfmtdJlfL7Rct/sTmqBO6GD9noBOUvPPpN7O2ryprPialt1yx1uzivFjby0Z+3cDGzTA/EhWX451/N6I+5JPPh5XUH+ZdVHdPiofjyoarqRhVKQuejxThG0qF+8/QgaBbqJ1mfL33fwxjkXxzULXhKVnDgGxRjhJ99RmoqPxy7DbkWjgOzGrP1mEqUtb5FSLUzsanNWKUeU6XQS8+S5Kg24LRA3kBllFBNhaL8xNQAeFTkBlSj6P0X3cgphTWHbnEArsYipWGAF6x6qj+XzmzPeb2mlEdioxJXMVnxw8t/45yIXp94HwxNbCLZM5O+ae7l5eXw2b6bUJcDWKkJG0vMkkubJslMhRsb0J6bbIJNIVozsWezR1KlLDLTwUfIF0ddxFRjfcLmqqlQGCek9zUA/o9YCoKyRFh02R6dFM4kUQZqwnLsnGKQ/A+l2mn/SYaMXPsytaOIg/1f3wg3MSHz/0Pzx4X3y7v/szkTgGeh9P3xn3VXfdIUzfHEssOw35XtaQ2AEhdbmigK3/dmqGUeR8cjd3tzzeQx6cOUNIyXbjlVCj6SdkVkWdI4wAPaom33AIwHMwktcP7eE3PcDo6G9zF13NePtIGtM9urCk3MJpZn4a881m5d2uusUNiMXEI/hfKMRXhanefpyr1ieC/lOiwc0JRz5nFxceF04VIWKdQURQGkmCLD3/kFNmMatFDMLF/bRAG3+r+xES7dzgGKVPjGpK6yQ2IvKiZ9/2vHNVzUNU1ClO3ITm5Ox8VLfp5TqWGtxKTF0ishUrXUXSc1ypMqdPBirYX6unOLY//DuNr2SEyVcmzefYrhedWMv7Yl8HfHxnIqz2AMuUBhF3w99KFEzRyUytDaiEbyHKiRwKncknZoXuH0nrDKv39Ph8t3C6p14UwyFZbjn49qHwWvTewKI/79a61L4qTO6YKZ6i/eyoE3HrxPFXjTHAm8aTt2Ixc+P2BfLtt8Xpt73A7jb5D1iRKR5QMlY7AWnbmdryoGiFT/5JmpliixgDlJGNT2wy934U4hPP+LZWzWzV3ETGjoA/TVZSp1jvSHTrhFB3lZBbwp7R5lb7IWDcR1k3/0kVafWqtfS7drGKm/11w07i2Ygh0FsM4o9yN9Ok9sG4JSmn7WelZGbE+JETpifBRKwtADIxf6eylnuRFrR801WvAgCVK4EPrBthPwyMc7gPIarn92KDzWWzlmM3tBEXiX4CLuQ9+chbTsuicNdGzsB59gTsZlY2JV/RPeRQ9Ukooo8XURqjzyLLQwF+ztCq8Oi4E1jySoGofU80Bg8hdmiclGXbrUIiuNfXZfDNv6aKJRoV8JTCjeOTkuZRehl7KJnyEHruUALbo2DTRv0TUXg10t3XVVihWS1xMjfGA5xi3/cHxLzDqlPn67ZINWupF6rxDIgseSRFZWD2J2qTWozlkwINqs3yDQyxWa4fMWHeTJZSGiReoC/J+wNQnxTtf/7B3j0GhwvXAwS0c2Rb1WE3B1ddUDcmE54XkxPvzvbj4GzTGW96T7mgtvm3VO8cLnrNkLZ27cg/AAb3j3bz3gYXQSOnr1LsxatZuzTR+OevmVMwdAmL+yxMHAmxYty8rK4NXtV+CtXZazeTZrshaqTBYbS9FxZrSZ9tNZmInp1M18OH0rH/ZdzYH//Gkcnzwx3sccBNPnBjYFfxWOHcZMn6L5nb1doNsw+8+neyledzgsHtoMQlDdYg6V4PN8AXOAnsaonTT3FWgTn3pP/XoP8d9cVcqN7GJo/Mpu1dMg/TT95pPah4nGNVLdkI0KJl+4B/0+VhdWV2lIBHIPdwyHl4bEQFyY8VmglNpn90nAOXUrj/uf2IXrRJQmz9okDuDU65wdv6CyewR/ALRItHNGAnSOCgDShfOlcX45qWNSZWw5hgkahreFIF5We6nyctfJjOr5tfvhnU1H9IqRFD6+Swx6WF7mkjuQrpslf9ArKHLCwJvpvbefvQOjV51BNogUdsBLBJgLESwXDoy2eKTBcwiWLd/6QzVXhsUHoSQYDzHB5kmiajo8hFIvWTR0i67+qFRTTXWZYZ8dga1ndeGI1VZ6tk8kLMPFPVPpGr4wol7TOaLJtUHrurN6R3JfOGq8H+XasuW9tQh+k/97wuwu+8Q0gPfHxUF7/Nq0JZHtf9/llnkByY1beuXB2fUZKC+lQCH+rAFy7pmy9hyk/F9bbmGSv5DJP2blhXvKsEOhYSl7DnleJkYGoUut8Z9xmRgrfML727gIiMI+SE+740QafDq1DzzRt6VkcCphPQbetCcAv5pZAFO/v1hnwJvmS1YA1orNUYo8U0vjE0Nh3RNt1RY3qxxJcgMwQcKJBd3MakeuMqkYjaUPUq5xi669EGBMIbWLmKsfbgMPd2poShe1WueWBRYwx2BIiB+ntq2VLw5bmUDqL2Lyf7IlfS/jzKfxL9HxZUy5Nn71acgt0nezJ+BTQ25ondKvVSPoERuOTj95cOBSBqSjWZ9auoamgN0X/ygK3qyNthiGdlq/eJPAm1QnZP44euVpLj4xa7Mu7OkTz1pkzAN7G2M/24rCMLYL4St5AFqLjJk7GwONiTL4FJq4jqD2nXEXw2E4It3M1eW+NWfsFF9cjWBpTh9SdU15JqTakrsuDeBU692B34OT83JhA/uv5cFDX5/GZMKmgThrj9KhdcHkyN5ogkRmfpTgOBVBvUAkSTHVIUmHJO9z6fJ2yJSvUy0JJW96MdEL6kxG3cu4cxQX+KxFxkihx3Acal/45o43DpMFe2HyADcr2oib6jF4nqxSTIykqFYCP3rdMROPWMKE8LgNnzPhc2rMF6mwrjHnymLJB+c94EpqCi6+dxE2PLZNEKyaHI8WHvqLmua+9egfguzIhYM7kXYPEheuFQ5D77xnXASXxYeSTSiRELyzMLPQpP+ehl2XcpSqavc1DliEA/RhkPx0J+iB+vl7aDqny0xTAnfyMEsNSpDcOR7fyceMNdy1qj1+xRRrwZ4s8hs4ciNCjBSfy7w9YVBeSEvescICfZr5ww+PtgYCTP6iprkgLuyHzumzcc7Xe2HtnxfgHurBwzDlWmOMR948LAAoIuJgdIsn6VvNpITgnZ5dCGNXnoIjN9AUXiONAzbkABkHlOPDreGxDZleR7pSg3W6qS5MisZX/l48iRDOvW2EN6yb0gqigrw56xQCb7YJy9b2Oft0pz0tVtJ2Fh1Ixq48CZdQv6+RxgGNAxoHHIUD6gGcZjQ7ORGDPCbhUbWrPZtoEDpjrJjQAka2DuUkcZLGiewJyPlSNx3TgiXZaj6z4RJ6AFo2Whzji7bXOKBxQOOAtThgHIDTKOYmxUNF+VY8ihIb1LO9GqHNaTPwdDO0E7eGWkVsDMJrfKmbSd60WDnv54vw1cG6G6BKyAftXOOAxoG6xQHjAZzmP3tHY1Q0Uxo20SSSsSGe8N7o5kCxf4V6cVuDuFDqJpXJj3/dhnmbLtdJ9/i69Xhqs9E4oHFAjgOmATi1uDipAWRXfIMu98OlOnggMRheH94Mve28q1UpTKViTSAXStxM6ia35wW/XIJt5+TNEKXmo13XOKBxQOOAPXHAdACnWVRWOsG8HfOh0ul1PBb16nRBO6nJ7UJgfr9IaBXuYyCRUzOWAnMmbeuGpkvGTBL34bRceDvpGmzAbPIq/Y2oCY00Dmgc0Dhg1xwwD8DZ1Obt6o568f8hOjZll4R7NEyB4S0DYUqncBjVOoSLxSGUxhmQs72wDeE5X9KmewzAaU/BjDacuAP/PXwbdl7QJG4h77RzjQMaBxyfA5YBcOLD4oPekJ39IjhVzkGnH1kvmgYYinF8QjBmgAmC3jEBEIQ25Ay0hXspFouB9210v02+lAW/ns6En05mQr6JbspSfWrXNQ5oHNA4YE8csByAs1nprFQ+xNNB7JLcniTz9hijuGe0P8SjiiUOQ23GhXpBhL9HdTUG6gy06UZaVhGcQ1fkc+jyfgp123uu5MIJDG2qkcYBjQMaB+oLBywP4Ixz85L6oaH1C3iqCshZNbYn3bmfhwsmD3DGvSsK9YBB+stQNVLB7dUG82HtaXuNAxoHNA7UNQ5YD8AZp2bv6IpqlQW40DkatdTGx45l7Wh7jQMaBzQOaBzQ44D1AZx1t2hfMBTlPwhOFVNQnLZecGbWn7bXOKBxQONAHeeA7QCcz0hdXJWB6AzUHy/3R0BXzqjLr68daxzQOKBxQOOAqsB91mfT/B3Nody5FVSWt0RzlJZoD4hRD52CUPWCeZCcwvDcC69TPllM+1JZjqOmwCVlqJbBoN2VlIywEO8XYDnbZQqwPle0HjQOaBzQOCDLgf8PZSWY1CgZk0cAAAAASUVORK5CYII=" /></h1> -->
<p style="color:red; font-size:12px; font-weight: bold;" align="center"><i>Classification: ${SECURITY_BANNER_TEXT}</i></p>
<h1 style="color: #000000;">${title}</h1>

<#if comment??>
	<div>
		<h3 style="color: #981B1E;">Daily Rollup Notes:</h3>
		<p>${comment}</p>
	</div>
</#if>

<table class="tallyTable" cellspacing=0 >
	<tr>
		<th rowspan=2>Organization</th>
		<th rowspan=2># of Reports</th>
		<th colspan=6>Cancelled Reasons</th>
	</tr>
	<tr>
		<th>By Advisor</th>
		<th>By Principal</th>
		<th>Transportation</th>
		<th>Force Protection</th>
		<th>Routes</th>
		<th>Threat</th>
	</tr>
	<#list outerGrouping as org>
		<#assign orgReports = org.all >
		<#if orgReports?size gt 0>
			<tr>
				<td>${org.name}</td>
				<td>${org.nonCancelled?size}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_BY_ADVISOR")}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_BY_PRINCIPAL")}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_DUE_TO_TRANSPORTATION")}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_DUE_TO_FORCE_PROTECTION")}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_DUE_TO_ROUTES")}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_DUE_TO_THREAT")}</td>
			</tr>
		</#if>
	</#list>
	<#assign allReports = reports.nonCancelled >
	<tr>
		<td><b>Total</b></td>
		<td><b>${allReports?size}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_BY_ADVISOR")}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_BY_PRINCIPAL")}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_DUE_TO_TRANSPORTATION")}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_DUE_TO_FORCE_PROTECTION")}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_DUE_TO_ROUTES")}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_DUE_TO_THREAT")}</b></td>
	</tr>
</table>

<hr />

<#assign counter = 1>

<#list outerGrouping as principal >
	<#if principal.nonCancelled?size gt 0>
		<h2>${principal.name}</h2>
		<#assign byAdvisor = principal?api.getByGrouping(innerOrgType) >
		<#list byAdvisor as advisor >
			<#if advisor.nonCancelled?size gt 0>
				<h3>${advisor.name}</h3>
				<#list advisor.nonCancelled as report>
					<#if ! (report.cancelledReason??)>
						${counter}. Report #${report.uuid} <#assign counter = counter + 1>
						<@renderReport report />
						<#sep><hr /></#sep>
					</#if>
				</#list>
				<#sep><hr /></#sep>
			</#if>
		</#list>
	</#if>
</#list>

<#macro renderReport report>
	<#if report.cancelledReason??>
	    <p className="report-cancelled" style="border-left:16px solid #DA9795;padding-left:10px;">
	        <strong>Cancelled:</strong>
	        ${(report.cancelledReason)!}
	    </p>
	</#if>

	<div>
		<#assign reportPrimaryAdvisor = report.loadPrimaryAdvisor(context).get()>
<!--		<img height="20" alt="${(reportPrimaryAdvisor.role)!}" src="data:image/png;base64,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"  />
		${(reportPrimaryAdvisor.rank)!} -->
		<strong>Advisor:</strong> ${(reportPrimaryAdvisor.name)!} -
		${(report.loadAdvisorOrg(context).get().shortName)!}
	</div>

	<div>
		<#assign reportPrimaryPrincipal = report.loadPrimaryPrincipal(context).get()>
<!--		<img height="20" alt="${(reportPrimaryPrincipal.role)!}"  src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAAXNSR0IArs4c6QAABRtJREFUWAndmEtoXFUYx2cmMTPJQnCRFlOpj0A2FnSRSQUftIqCeYxmSlBaGxDRrlLcuQoEde8iC6niIpS4iU7SmSToRktILWSysOLC0AZja5tWKkogkzhkZvx9l3uud86c+0pSKB4495zvef73O+8Ti93nKb5bfNls9uHt7e1MPB5/Hh+HarVaB/UO8Uf9FsU6+WYikbhYrVYL8/Pzt0UWNUUCODIyklxdXT0DkJOA6KGxsPY1bIrk862trZ9NTU2VwwIN1cDY2FhiaWnpFA18BLBHwzr30FvDz2g6nf4Sv1UPHYcdCHBgYOBwpVL5Gotux2p/KsVUKpXN5XK/+7nzBZjJZJ7d2dnJ4eCAn5PdyojkHWyzc3NzP3j5SHgJ+vr63iRy3yG/J+CkXYbLQYrv+/v73xDalIwRlMgJOBy0mIx8eMtEJYXdER+dBhE2MmmOmyLZANAec0UMfCOH0ypA6noA3svYtcG/oKHYRJaA36rxHRL5nWQy2a2PyboGZLbaEyII3IWWlpYDOL3qtBCL/QOAu01NTbIG7ig+OpXm5uZjrIevwKspvl5ie5B1NScY3LI6QpYShIGzlcbOTU9P/4nTSdvZT4A4wmL8Yz6fX0beDbCfbdl14RUKhUWJkrtxQz1tY3BEDkBZhHHwsSPxqbAzWOsX+lXybbrmRUBcUyazs7NXAHkU2aLiRSg/HBoacsa+A1B2CCJyOIIjpfqtRFMRqiRiJUBOKDpC+djW1tZ7St8ByN9K9+4mPaWPG+WE8Xxc1aOUBOq00rcAysYPM62YUUrsnmbcPKfbsBo8Du+kzg9DCxbBJLoWwHK5/Br1hiVHd0aUr5IXyH/ZsiuUrzM5FnRduvhXZvRL8GWbVOkytr8owqeMg6lf5M3yYczLkSkw8WcJGj1B43dFmYU172eEnuxEkq3U1tb2dqlUuqRovxJMx5B/bkWQv7LOcX4GtqwTkO+G0DOqbG5ufoD9k0ZhI/OQsKwIYhQWoETbWQLcPhlzJ5C9ii9ZwP8gf8Fyc9mtQ/1BjfYkVdCiRjCG4QO6197e3glm7FeAewfZgJTkRQ4cb7l1sU256YD6f5MERc8tyODEirriDw4OyrY4rGhVAlB+/n1F22UUgJaJFUGcyf0hbKoDSOTqaLcT/OrRTrrlfnVsb4lcdbFF+BkoGYaegJSOV4ltlAhaQVMRDA3QNAa9ABn4xglm0BPWTfmoaCxQD7vqKxuxj7HflgA9aRHaB/4NnaXRniR+L4rQaozLS56z2KfQgbuJshFjSTMzM39T1M1WS7C3T40lqyAurC7mFLvO38opOjDtZQwGOrcVBIu66FsAhU/Dxm7SnWKsz0xdZc80bZxXThyAnZ2d5xD8pgReJT8SKtIme/yvmfgab01eHxTPATg+Pi53ilElMJU0MEHoPzHJwvDa29vP4mPBTxf5qPtppG5G9vT0THK2O4sDr3vJQ5zTHkFe8WvES7axsSGz/gwTYI5gPGHQK8qTCKckR9Qwa8NeOx0P+1QhcsHXTmmLM9x1bmhZDMr71HagG7st4ztNk8l6ZWXlRldX1zUMM8iNOia73fAEHHmYbv3GZN/QxW6l+/rxSIBy173EEV8uU8tu4PtUL8pTh+k9xu3fWWbcTHddxiSz+yi8YboicJ1023rU18QXPp/R32FM+r5drBu4noBPsUxIZMPa39snYB2o0HJvlUd0qi8Q2Q4AO4/o8Nah5QhnPaLz0DQr+z30/y/9C1Az+eJW8o49AAAAAElFTkSuQmCC" /> -->
		<strong>Principal:</strong> ${(reportPrimaryPrincipal.name)!} <!-- ${(reportPrimaryPrincipal.rank)!} --> -
		${(report.loadPrincipalOrg(context).get().shortName)!}
	</div>

	<div>
		<strong>${fields.report.atmosphere}:</strong> ${(report.atmosphere)!}
		<#if report.atmosphereDetails??>
			- ${(report.atmosphereDetails)!}
		</#if>
	</div>

  <#assign tags = report.loadTags(context).get()>
  <#list tags as tag>
  <div class="row">
    <div class="col-xs-12">
      <strong>Tag:</strong> ${(tag.name)!} ${(tag.description)!}
    </div>
  </div>
  </#list>

	<div >
<!--		<img height="20" alt="Location" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAeCAYAAAAy2w7YAAAAAXNSR0IArs4c6QAABNpJREFUSA2VlmtMm2UUx+mFcsm4hMVkJYM0ypxLNpJF1GyhlDFdRB1ui7BI1DiNic7ED8ZbMCZkZn7QLRovIYLZkn0xcyYiH/ZhFCgF3FR0shBv0U3aKcxNxIwxC5T6O2/f07wttKtP8vSc55z/Of/nOc973re2nCxHfX19fjQavTkWi5XbbLZVdrv9EvrFYDAYziaFLROovb3d3tfX10LCvcwdYAtT8ZCex/d5bm5uZyAQ+DHVr+u0RLW1tXcDOkySagVnkhBG8R9xOp1tEF5Jxa5IBMmrELwOWP1X0U9Srj7sYZLKeg36BuRO5B0W7AS4pqGhoXPYEkMTJQyQfEDgftNwnaSHy8rK3uzp6ZHkKw5ibifmLZzbBEDMNWYDZF9pQBIRAc8S8L4JDrOzB7nsswrOJImz1dXVvba0tNQODh7bZEFBQU1vb+8fEmeXHxmA1gF+W3RAl10ulzdbEjMmxgkOoL8ka3K55+bmukSXkSBiJ2+wzjWsOTkt/f39E6b+v8TIyMghNvqJGXSfz+czyukUAyWT/nhIdECfDg8PB0S3DvpozeLi4kFwPuxu5hilPcapPyQmZsWiv4itCaz0npxwQE+0S4EA5FKTBmXdvLCwME7gEzhuYUo/baEKHWyyG3vSXbPREHmOSxJ8DY2NjcVKdK8YGb+zw6/javy3ubnZxa6OsVotFhL0MjuY+kZo8nq9z8XRSb/d5so1OzvboEQeMRL8LTOpDFNTU1twbRQ/4wC73cHcn5+fvwns+bg55ylTJoTD4RjVBSf3KFG5aTQeRQWIBLRZ13l5eZ2q+/3+fyDS8myQd6H6TDmFNDYNzm0QWWostU8a7OyyGubn59eqLpI4Y02iqwMDAxGrr7i4uIC1cXf47cZTh/IXQUKy3goWnXfXGe5oCVU21cl9PFpaWvrLzMxMKzGtgmF8QY6kkk9PT98adxkbuqKl0/fSesvpDBz99CtJ3pEFvmpKOUaSa8gu1g58EeYLmlQlj/5tqoM7ZxABDIoRQwkNtlMBKouKitrQ3xOI2kQSN4nYxRvhe6tddKrwmGlb4BNy2qghF7mWPpnAIcSjdLe8jZcN+mkTJ/HicEMyxv35+STMpALJV0M+o03AfcZTuifRaDTecU7UIkE4W3F+nJogmzUkTkhOgd0meO64bnBwcEjvSAwvY78uTsZRLn17XM3+l43aIDlKhEHChk8IiWRIEFGC33DsZUYJyGN2Q3Z/tjScZBVVkT57xIw5y3fsSY1PlE4NJH+ce5Bd6TjJJ+N5+uQnNaRKCB5mY4ewl4uPzV6gQlvZvDStMRyqqAyFQt95PJ4/CbwHm/jXQfxMRUXFeDgc/kFxKiH5COxB1kVig+RLSHZDElKMYbcurDonqybBu0yfAbTZZklyl/VRBvM0m+gw/X8jX8HfBS6pDQy//GQa7HgfZEcEQ4KfeZneKe85HvWt9EoAs3wsp3nUa3jzX0BfcSwrXSpKSllZWVmCXd7iq0m+saqqKshH0M+6BHL5m7WbdvgGmXYknrq0CBx0tvGVFAyneyASiYwh3bKGqI0G7xU901j21KUDcx83kXyUWakYSE5wEqPJ1ZZOZnUiCeaS5XOxh+T/msnGCwsL95n6DcUN78iagfua5DG/CFk95dzO//JLVn8m/T+fNBtEUB+vwQAAAABJRU5ErkJggg==" /> -->
		<strong>Time and Place:</strong> ${(dateFormatter.format(report.engagementDate))!} @ ${(report.loadLocation(context).get().name)!}
	</div>
	<#assign tasks = report.loadTasks(context).get() >
    <#list tasks as task>
    <div class="row">
        <div class="col-xs-12">
            <#-- <a href="${serverUrl}/tasks/${task.uuid}"> -->
<!--                <img height="20" alt="Task" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAXCAYAAAD+4+QTAAAABmJLR0QA/wDWABipT60nAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QERBQskHTWEPAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAGnSURBVEjHzZUxqsJAEIZnAtlgFYM22huJd9AriHYK2uoBFG+QRi+TSgtNoZUi2wUxsRMU21zgf5XyghoTUd5bGLbYnf3499+ZZQCgLw8lbcJ2u01PQYoxnU5RrVYxm83SpCGVEtd1abVakeu631GyXq9RKBRARCgWi9hsNp9X4jgOnc9nYmY6nU7kOM5nlRyPR+i6DiK6RTabxeVySaSEHz3h5XJJvu/TbrejIAhov9+T7/vEzATgNpumSeVymUqlElmWRaZpUq1Wi1di2zY0TUMmk4GmaRBCQFVVMHNEBRGBmcHMUFUVQohInm3bESV319Xr9aAoysOD44KZoSgK+v3+3XU99KTT6UAIkRjEzBBCoNvtPvTkqfGtVisR6Apot9tPjY99XfV6PRGk0Wi8XyfNZjNRGbzaFwuRUhIzv4RIKd+HeJ73EsLM5Hne+5DD4UC/a7VSqdBoNCLLsiL7giB4v61cW4lhGJhMJpG18XgMwzBARNB1Pdb4p5D5fI5cLofhcBh7wGAwQD6fx2KxSA+RUiIMw0QNMAxDSCnTNcg//+P/LeQHMm6FWr8JMB8AAAAASUVORK5CYII=" /> -->
                <strong>${fields.task.shortLabel}:</strong> ${(task.shortName)!} ${(task.longName)!}
            <#-- </a> -->
        </div>
    </div>
    </#list>

    <div class="row">
        <div class="col-md-8">
            <p><strong>${fields.report.intent}:</strong> ${(report.intent)!}</p>
            <#if report.keyOutcomes??>
                <p><strong>${fields.report.keyOutcomes}:</strong> ${(report.keyOutcomes)!}</p>
            </#if>
            <#if report.nextSteps??>
                <p><strong>${fields.report.nextSteps}:</strong> ${(report.nextSteps)!}</p>
            </#if>
            <#if showReportText >
                <p><strong>${fields.report.reportText}</strong> ${(report.reportText)!?no_esc}</p>
            </#if>
        </div>
    </div>

    <a href="${serverUrl}/reports/${report.uuid}/min" >
        Read full report
    </a>
</#macro>
