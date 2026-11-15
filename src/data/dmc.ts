import type { DmcColor } from '../lib/types'
import { byLang } from '../i18n'
import DE_NAMES from './dmcNames.de'
import EN_NAMES from './dmcNames.en'
import ES_NAMES from './dmcNames.es'

/**
 * DMC Mouliné Spécial catalogue: `code|French name|hex`. The names in the other
 * interface languages live in `dmcNames.<lang>.ts`.
 *
 * Stored as one string rather than ~470 object literals: it keeps the module
 * small, diffable and trivially extendable, and parsing it once at import time
 * costs well under a millisecond.
 */
const CATALOG = `
B5200|Blanc neige|FFFFFF
blanc|Blanc|FCFCFC
ecru|Écru|F0EADA
01|Blanc étain|E2E2E1
02|Étain|D4D4D4
03|Étain moyen|BCBCBC
04|Étain foncé|AAAAAA
05|Bois flotté très clair|F2E8D8
06|Bois flotté clair|E8D9C2
07|Bois flotté|D2BE9E
08|Bois flotté foncé|A08C72
09|Cacao très foncé|5B4A3E
10|Vert tendre très clair|E8F0C8
11|Vert tendre clair|DCE8B4
12|Vert tendre|C9D99A
13|Vert Nil moyen clair|9ED0B4
14|Vert pomme pâle|D8E8B0
15|Vert pomme|C4DC96
16|Chartreuse clair|B8CC60
17|Prune jaune clair|F2E68C
18|Prune jaune|E8D45E
19|Or d'automne moyen clair|F2C77A
20|Crevette|F2A98C
21|Alizarine clair|E0A99A
22|Alizarine|C4705E
23|Fleur de pommier|E8DCE8
24|Blanc lavande|DCD8E8
25|Lavande ultra clair|D0C8E0
26|Lavande pâle|C2B6D8
27|Blanc violet|E8E2EE
28|Aubergine moyen clair|8E7AA8
29|Aubergine|6E4F8E
30|Myrtille|7B7FAE
31|Myrtille moyen clair|9196C2
32|Myrtille clair|A8ACD4
33|Fuchsia|B5538E
34|Fuchsia foncé|9A3A74
35|Fuchsia très foncé|7E2A5C
48|Panaché rose tendre|E8B8C2
51|Panaché corail|E88C78
52|Panaché prune|B07CA8
53|Panaché framboise|D4648C
57|Panaché bruyère|9E6E9E
61|Panaché cranberry|C45A7A
62|Panaché rouge Noël|C8485A
67|Panaché bleu ciel|8CB4D4
69|Panaché violet|8C6EA8
75|Panaché rose ancien|D48C9E
90|Panaché jonquille|E8C878
91|Panaché prairie|8CA868
92|Panaché mousse|9EA85E
93|Panaché bleu nuit|5E6E9E
94|Panaché vert sapin|5E8C68
95|Panaché lilas|A88CB4
99|Panaché mauve|B47C9E
101|Panaché corail doux|E09A8C
102|Panaché violette|8C6EB4
103|Panaché lavande|A89ACC
104|Panaché pastel|D8C8E0
105|Panaché améthyste|9A7AB4
106|Panaché cerise|C85A78
107|Panaché bonbon|E8909E
108|Panaché bleuet|7A8CC4
111|Panaché mûre|8C5A9E
112|Panaché grenat|A84A5E
113|Panaché terre|B4846E
114|Panaché nuit|4A5A8C
115|Panaché brique|C06A5A
121|Panaché bleu doux|9AAED4
122|Panaché vert d'eau|9ECCB8
124|Panaché rose poudré|E0A8B4
125|Panaché ardoise|8C94A8
126|Panaché automne|C08C5A
150|Rose poussière ultra foncé|AB0237
151|Rose poussière très clair|F0CED4
152|Rose coquillage moyen clair|E2A099
153|Violet très clair|E6CCD9
154|Raisin très foncé|572433
155|Bleu violet moyen foncé|9891B6
156|Bleu violet moyen clair|A3AED1
157|Bleuet très clair|BBC3D9
158|Bleuet moyen très foncé|4C526E
159|Gris bleu clair|C7CAD7
160|Gris bleu moyen|999FB7
161|Gris bleu|7880A4
162|Bleu ultra très clair|DBECF5
163|Vert céladon moyen|4D8361
164|Vert forêt clair|C8D8B8
165|Vert mousse très clair|EFF4A4
166|Vert mousse moyen clair|C0C840
167|Beige jaune très foncé|7B552F
168|Étain très clair|D1D1D1
169|Étain clair|848484
208|Lavande très foncé|835B8B
209|Lavande foncé|A37BA7
210|Lavande moyen|C39FC3
211|Lavande clair|E3CBE3
221|Rose coquillage très foncé|883E43
223|Rose coquillage clair|CC847C
224|Rose coquillage très clair|EBB7AF
225|Rose coquillage ultra clair|FFDFD5
300|Acajou très foncé|8F430F
301|Acajou moyen|B35F2B
304|Rouge moyen|B71F33
307|Citron|FDED54
309|Rose profond|D62B5B
310|Noir|000000
311|Bleu marine moyen|1C5066
312|Bleu layette très foncé|35668B
315|Mauve ancien moyen foncé|814952
316|Mauve ancien moyen|B7737F
317|Gris étain|6C6C6C
318|Gris acier clair|ABABAB
319|Vert pistache très foncé|205F2E
320|Vert pistache moyen|69885A
321|Rouge|C72B3B
322|Bleu layette foncé|5A8FB8
326|Rose très foncé|B33B4B
327|Violet foncé|633666
333|Bleu violet très foncé|5C5478
334|Bleu layette moyen|739FC1
335|Rose|E3516B
336|Bleu marine|253B73
340|Bleu violet moyen|ADA7C7
341|Bleu violet clair|B7BFDD
347|Saumon très foncé|BB3232
349|Corail foncé|D21035
350|Corail moyen|E04848
351|Corail|E96A67
352|Corail clair|FD9C97
353|Pêche|FED7CC
355|Terre cuite foncé|984436
356|Terre cuite moyen|C56A5B
367|Vert pistache foncé|617A52
368|Vert pistache clair|A6C298
369|Vert pistache très clair|D7EDCC
370|Moutarde moyen|B89D64
371|Moutarde|BFA671
372|Moutarde clair|CCB784
400|Acajou foncé|8F430F
402|Acajou très clair|F7A777
407|Sable du désert foncé|C28E7D
413|Gris étain foncé|565656
414|Gris acier foncé|8C8C8C
415|Gris perle|D3D3D6
420|Brun noisette foncé|A07042
422|Brun noisette clair|C69F7B
433|Brun moyen|7A451F
434|Brun clair|985E33
435|Brun très clair|B87748
436|Tan|CB9051
437|Tan clair|E4BB8E
444|Citron foncé|FFB000
445|Citron clair|FFFB8B
451|Gris coquillage foncé|917B73
452|Gris coquillage moyen|C0A9A2
453|Gris coquillage clair|D7C3BC
469|Vert avocat|72843C
470|Vert avocat clair|94AB4F
471|Vert avocat très clair|AEBF79
472|Vert avocat ultra clair|D8E498
498|Rouge foncé|A7132B
500|Vert bleuté très foncé|044D33
501|Vert bleuté foncé|396F52
502|Vert bleuté|5B9071
503|Vert bleuté moyen|7BAC94
504|Vert bleuté très clair|C4DECC
505|Vert jade|338362
517|Wedgewood foncé|3B768F
518|Wedgewood clair|4F93A7
519|Bleu ciel|7EB1C8
520|Vert fougère foncé|374B33
522|Vert fougère|A9B89E
523|Vert fougère clair|BCC6AF
524|Vert fougère très clair|C4CDB2
535|Gris cendre très clair|636458
543|Brun beige ultra clair|F2E3CE
550|Violet très foncé|5C184E
552|Violet moyen|803A6B
553|Violet|A3638B
554|Violet clair|DBB3CB
561|Jade très foncé|2C6A45
562|Jade moyen|53976A
563|Jade clair|8FC098
564|Jade très clair|A7CDAF
580|Vert mousse foncé|888D33
581|Vert mousse|A7AE38
597|Turquoise|5BA3B3
598|Turquoise clair|90C3CC
600|Cranberry très foncé|CD2F63
601|Cranberry foncé|D1286A
602|Cranberry moyen|E24874
603|Cranberry|FFA4BE
604|Cranberry clair|FFB0BE
605|Cranberry très clair|FFC0CD
606|Rouge orangé vif|FA3203
608|Orange vif|FD5D35
610|Brun terne foncé|796047
611|Brun terne|967656
612|Brun terne clair|BC9A78
613|Brun terne très clair|DCC4AA
632|Sable du désert ultra foncé|865947
640|Gris beige très foncé|857B61
642|Gris beige foncé|A49878
644|Gris beige moyen|DDD8CB
645|Gris castor très foncé|6E655C
646|Gris castor foncé|877D73
647|Gris castor moyen|B0A69C
648|Gris castor clair|BCB4AC
666|Rouge Noël vif|E31D42
676|Vieil or clair|E5CE97
677|Vieil or très clair|F7E2BC
680|Vieil or foncé|BC8D0E
699|Vert|0B6232
700|Vert vif|07731B
701|Vert clair|3F8F29
702|Vert Kelly|47A72F
703|Chartreuse|7BB547
704|Chartreuse vif|9ECF34
712|Crème|FFFBEF
718|Prune|9C2462
720|Épice orangée foncé|E55C1F
721|Épice orangée moyen|F27842
722|Épice orangée clair|F7976F
725|Topaze moyen clair|FFC840
726|Topaze clair|FDD755
727|Topaze très clair|FFF1AF
728|Topaze|E4B468
729|Vieil or moyen|D0A53E
730|Vert olive très foncé|827B30
731|Vert olive foncé|938B37
732|Vert olive|948C36
733|Vert olive moyen|BCB764
734|Vert olive clair|C7C077
738|Tan très clair|ECCC9E
739|Tan ultra clair|F8E4C8
740|Mandarine|FF8B00
741|Mandarine moyen|FFA32B
742|Mandarine clair|FFBF57
743|Jaune moyen|FED376
744|Jaune pâle|FFE793
745|Jaune pâle clair|FFF0C5
746|Blanc cassé|FCFCEE
747|Bleu paon très clair|E5FCFD
754|Pêche clair|F7CBBF
758|Terre cuite très clair|EEAA9B
760|Saumon|F5ADAD
761|Saumon clair|FFC9C9
762|Gris perle très clair|ECECEC
772|Vert jaune très clair|E4ECD4
775|Bleu layette très clair|D9EBF1
776|Rose moyen|FCB0B9
777|Framboise très foncé|913546
778|Mauve ancien très clair|DFB3BB
779|Cacao foncé|624B45
780|Topaze ultra foncé|94631A
781|Topaze très foncé|A26D20
782|Topaze foncé|AE7720
783|Topaze moyen|CE9124
791|Bleuet très foncé|464563
792|Bleuet foncé|555B7B
793|Bleuet moyen|707DA2
794|Bleuet clair|8F9CC1
796|Bleu roi foncé|11416D
797|Bleu roi|13477D
798|Bleu Delft foncé|466A8E
799|Bleu Delft moyen|748EB6
800|Bleu Delft pâle|C0CCDE
801|Brun café foncé|653919
803|Bleu layette ultra foncé|2C597C
806|Bleu paon foncé|3D95A5
807|Bleu paon|64ABBA
809|Bleu Delft|94A8C6
813|Bleu clair|A2C2D1
814|Grenat foncé|7B001B
815|Grenat moyen|87071F
816|Grenat|970B23
817|Rouge corail très foncé|BB051F
818|Rose layette|FFDFD9
819|Rose layette clair|FFEEEB
820|Bleu roi très foncé|0E365C
822|Gris beige clair|E7E2D3
823|Bleu marine foncé|213063
824|Bleu très foncé|396987
825|Bleu foncé|4781A5
826|Bleu moyen|6B9EBF
827|Bleu très clair|BDDDED
828|Bleu ultra clair|C5E8ED
829|Olive doré très foncé|7E5D1B
830|Olive doré foncé|8D6B2C
831|Olive doré moyen|AA8F3A
832|Olive doré|BD9B3E
833|Olive doré clair|C8AB6C
834|Olive doré très clair|DBBE7F
838|Brun beige très foncé|594937
839|Brun beige foncé|675541
840|Brun beige moyen|9A7C5C
841|Brun beige clair|B69B7E
842|Brun beige très clair|D1BAA1
844|Brun castor ultra foncé|484848
869|Brun noisette très foncé|835E39
890|Vert pistache ultra foncé|174923
891|Œillet foncé|FF5773
892|Œillet moyen|FF7F8D
893|Œillet clair|FC90A2
894|Œillet très clair|FFB2BB
895|Vert chasseur très foncé|1B5915
898|Brun café très foncé|492A13
899|Rose moyen|F27688
900|Orange brûlé foncé|D15807
902|Grenat très foncé|822637
904|Vert perroquet très foncé|557822
905|Vert perroquet foncé|628A28
906|Vert perroquet moyen|7FB335
907|Vert perroquet clair|C7E666
909|Vert émeraude très foncé|156F49
910|Vert émeraude foncé|187E56
911|Vert émeraude moyen|189065
912|Vert émeraude clair|1B9D6B
913|Vert Nil moyen|6DAB77
915|Prune foncé|820043
917|Prune moyen|9B1359
918|Cuivre rouge foncé|82340A
919|Cuivre rouge|A64510
920|Cuivre moyen|AC5414
921|Cuivre|C66218
922|Cuivre clair|E27323
924|Vert gris très foncé|566A6A
926|Vert gris moyen|98AEAE
927|Vert gris clair|BDCBCB
928|Vert gris très clair|DDE3E3
930|Bleu ancien foncé|455C71
931|Bleu ancien moyen|6A859E
932|Bleu ancien clair|A2B5C6
934|Vert avocat noir|313919
935|Vert avocat foncé|363E1E
936|Vert avocat très foncé|3A4724
937|Vert avocat moyen|4C5D2B
938|Brun café ultra foncé|361F0E
939|Bleu marine très foncé|1B2445
943|Aigue-marine moyen|3D9384
945|Fauve|FBD5BB
946|Orange brûlé moyen|EB6307
947|Orange brûlé|FF7B4D
948|Pêche très clair|FEE7DA
950|Sable du désert clair|EED3C4
951|Fauve clair|FFE2CF
954|Vert Nil|88BA91
955|Vert Nil clair|A2D6AD
956|Géranium|FF9191
957|Géranium pâle|FDB5B5
958|Vert d'eau foncé|3EB6A1
959|Vert d'eau moyen|59C7B4
961|Rose poussière foncé|CF7373
962|Rose poussière moyen|FD9696
963|Rose poussière ultra clair|FFD7D7
964|Vert d'eau clair|A9E2D8
966|Vert tendre moyen|B9D7C0
970|Citrouille clair|F78B13
971|Citrouille|F67F00
972|Canari profond|FFB515
973|Canari vif|FFE300
975|Brun doré foncé|914F12
976|Brun doré moyen|C28142
977|Brun doré clair|DC9C56
986|Vert forêt très foncé|405230
987|Vert forêt foncé|587141
988|Vert forêt moyen|738B5B
989|Vert forêt|8DA675
991|Aigue-marine foncé|2F8C84
992|Aigue-marine clair|6FAE9F
993|Aigue-marine très clair|90C0B4
995|Bleu électrique foncé|2696B6
996|Bleu électrique moyen|30C2D5
3011|Vert kaki foncé|898A58
3012|Vert kaki moyen|A6A75D
3013|Vert kaki clair|B9B982
3021|Gris brun très foncé|4F4B41
3022|Gris brun moyen|8E9078
3023|Gris brun clair|B1AA97
3024|Gris brun très clair|EBEAE7
3031|Brun moka très foncé|4B3C2A
3032|Brun moka moyen|B39F8B
3033|Brun moka très clair|E3D8CC
3041|Violet ancien moyen|956F7C
3042|Violet ancien clair|B79DA7
3045|Beige jaune foncé|BC966A
3046|Beige jaune moyen|D8BC9A
3047|Beige jaune clair|E7D6C1
3051|Vert gris foncé|5F6648
3052|Vert gris moyen|889268
3053|Vert gris|9CA482
3064|Sable du désert|C48E70
3072|Gris castor très clair|E6E8E8
3078|Jaune doré très clair|FDF9CD
3325|Bleu layette clair|B8D2E6
3326|Rose clair|FBADB4
3328|Saumon foncé|E36D6D
3340|Abricot moyen|FF836F
3341|Abricot|FCAB98
3345|Vert chasseur foncé|25552E
3346|Vert chasseur|406A3A
3347|Vert jaune moyen|71935C
3348|Vert jaune clair|CCD9B1
3350|Rose poussière ultra foncé|BC4365
3354|Rose poussière clair|E4A6AC
3362|Vert pin foncé|5E6B47
3363|Vert pin moyen|728256
3364|Vert pin|83975F
3371|Brun noir|1E1108
3607|Prune clair|C54989
3608|Prune très clair|EA9CC4
3609|Prune ultra clair|F4AED5
3685|Mauve très foncé|881531
3687|Mauve|C96B70
3688|Mauve moyen|E7A9AC
3689|Mauve clair|FBBFC2
3705|Melon foncé|FF7992
3706|Melon moyen|FFADBC
3708|Melon clair|FFCBD5
3712|Saumon moyen|F18787
3713|Saumon très clair|FFE2E2
3716|Rose poussière très clair|FFBDBD
3721|Rose coquillage foncé|A14B51
3722|Rose coquillage moyen|BC6C64
3726|Mauve ancien foncé|AA6E78
3727|Mauve ancien clair|DBA9B2
3731|Rose poussière très foncé|DA6783
3733|Rose poussière|E8879B
3740|Violet ancien foncé|785762
3743|Violet ancien très clair|D7CBD3
3746|Bleu violet foncé|776B98
3747|Bleu violet très clair|D3D7ED
3750|Bleu ancien très foncé|384C5E
3752|Bleu ancien très clair|C7D1DB
3753|Bleu ancien ultra clair|DBE2E9
3755|Bleu layette|93B4CE
3756|Bleu layette ultra clair|EEFCFC
3760|Wedgewood moyen|35869C
3761|Bleu ciel clair|ACD8E2
3765|Bleu paon très foncé|347F8C
3766|Bleu paon clair|99CFD9
3768|Vert gris foncé|657F7F
3770|Fauve très clair|FFEEE3
3771|Terre cuite ultra clair|F4BBA9
3772|Sable du désert très foncé|A06C50
3773|Sable du désert moyen|B67552
3774|Sable du désert très clair|F3CEBB
3776|Acajou clair|CF7939
3777|Terre cuite très foncé|863022
3778|Terre cuite clair|D98978
3779|Bois de rose ultra clair|F8CAC8
3781|Brun moka foncé|6B5743
3782|Brun moka clair|D2BCA6
3787|Gris brun foncé|625D50
3790|Gris beige ultra foncé|7F6A55
3799|Gris étain très foncé|424242
3801|Melon très foncé|E74967
3802|Mauve ancien très foncé|714149
3803|Mauve foncé|AB3357
3804|Rose cyclamen foncé|E02876
3805|Rose cyclamen|F3478B
3806|Rose cyclamen clair|FF8CAE
3807|Bleuet|60678C
3808|Turquoise ultra foncé|366970
3809|Turquoise très foncé|3F7C85
3810|Turquoise foncé|488E9A
3811|Turquoise très clair|BCE3E6
3812|Vert d'eau très foncé|2F8C84
3813|Vert bleuté clair|B2D4BD
3814|Aigue-marine|508B7D
3815|Vert céladon foncé|477B5D
3816|Vert céladon|65A57D
3817|Vert céladon clair|99C3AA
3818|Vert émeraude ultra foncé|115A3B
3819|Vert mousse clair|E0E868
3820|Paille foncé|DFB65F
3821|Paille|F3CE75
3822|Paille clair|F6DC98
3823|Jaune ultra pâle|FFFDE3
3824|Abricot clair|FECDC2
3825|Citrouille pâle|FDBD96
3826|Brun doré|AD7239
3827|Brun doré pâle|F7BB77
3828|Brun noisette|B78B61
3829|Vieil or très foncé|A98204
3830|Terre cuite|B96D5E
3831|Framboise foncé|B32F48
3832|Framboise moyen|DB556E
3833|Framboise clair|EA8699
3834|Raisin foncé|72375D
3835|Raisin moyen|946083
3836|Raisin clair|BA91AA
3837|Lavande ultra foncé|6C3A6E
3838|Bleu lavande foncé|5C7294
3839|Bleu lavande moyen|7B8EAB
3840|Bleu lavande clair|B0C0DA
3841|Bleu layette pâle|CDDFED
3842|Wedgewood très foncé|32667C
3843|Bleu électrique|14AAD0
3844|Turquoise vif foncé|12AEBA
3845|Turquoise vif moyen|04C4CA
3846|Turquoise vif clair|06E3E6
3847|Vert sarcelle foncé|347D75
3848|Vert sarcelle moyen|559392
3849|Vert sarcelle clair|52B3A4
3850|Vert vif moyen foncé|378477
3851|Vert vif clair|49B3A1
3852|Paille très foncé|CD9D37
3853|Or d'automne foncé|F29746
3854|Or d'automne moyen|F2AF68
3855|Or d'automne clair|FAD396
3856|Acajou ultra clair|FFD3B5
3857|Bois de rose foncé|68251A
3858|Bois de rose moyen|964A3F
3859|Bois de rose clair|BA8B7C
3860|Cacao|7D5D57
3861|Cacao clair|A68881
3862|Beige moka foncé|8A6E4E
3863|Beige moka moyen|A4835C
3864|Beige moka clair|CBB69C
3865|Blanc d'hiver|F9F7F1
3866|Brun moka ultra clair|FAF6F0
`

/** `code|name` lines to a lookup by code. */
function parseNames(text: string): Map<string, string> {
  return new Map(
    text
      .trim()
      .split('\n')
      .map((line) => line.split('|') as [string, string]),
  )
}

const FRENCH_LINES = CATALOG.trim()
  .split('\n')
  .map((line) => line.split('|'))

/** French name of every reference (the catalogue's own names), for searching. */
export const DMC_FRENCH_NAMES: Map<string, string> = new Map(
  FRENCH_LINES.map(([code, name]) => [code, name]),
)

/** Names in the interface language; `null` in French (the catalogue itself). */
const LOCAL_NAMES = byLang<string | null>({ fr: null, en: EN_NAMES, es: ES_NAMES, de: DE_NAMES })
const localNames = LOCAL_NAMES === null ? null : parseNames(LOCAL_NAMES)

if (import.meta.env.DEV) {
  // Every reference must be named in every language, and nothing more.
  const codes = new Set(DMC_FRENCH_NAMES.keys())
  for (const [lang, text] of Object.entries({ en: EN_NAMES, es: ES_NAMES, de: DE_NAMES })) {
    const names = parseNames(text)
    const missing = [...codes].filter((code) => !names.get(code))
    const extra = [...names.keys()].filter((code) => !codes.has(code))
    if (missing.length || extra.length) {
      console.error(`dmcNames.${lang}: missing ${missing.join(', ') || '-'}; unknown ${extra.join(', ') || '-'}`)
    }
  }
}

/** One catalogue entry per DMC reference, in catalogue order, named in the interface language. */
export const DMC_COLORS: DmcColor[] = FRENCH_LINES.map(([code, name, hex]) => ({
  code,
  name: localNames?.get(code) ?? name,
  hex: `#${hex}`,
}))

/** Fast lookup by DMC reference, e.g. `DMC_BY_CODE.get('310')`. */
export const DMC_BY_CODE = new Map(DMC_COLORS.map((c) => [c.code, c]))
