"""Genera ai-workspace/tutorial-de-uso.pdf (guía para el equipo comercial).

Uso: python3 ai-workspace/fuentes/generar-tutorial.py
Requiere: pip install reportlab
"""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import KeepTogether, ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

OUT = Path(__file__).resolve().parent.parent / 'tutorial-de-uso.pdf'
TITLE_BLUE = colors.HexColor('#1d4e89')
HEAD_BLUE = colors.HexColor('#2f75c8')

base = getSampleStyleSheet()
TITLE = ParagraphStyle('t', parent=base['Title'], fontName='Helvetica-Bold', fontSize=20, textColor=TITLE_BLUE,
                       alignment=TA_CENTER, spaceAfter=4)
SUB = ParagraphStyle('s', parent=base['Normal'], fontName='Helvetica-Oblique', fontSize=9, spaceAfter=10)
H1 = ParagraphStyle('h1', parent=base['Heading2'], fontName='Helvetica-Bold', fontSize=13.5, textColor=HEAD_BLUE,
                    spaceBefore=10, spaceAfter=4)
H3 = ParagraphStyle('h3', parent=base['Normal'], fontName='Helvetica-BoldOblique', fontSize=10, spaceBefore=8,
                    spaceAfter=4)
BODY = ParagraphStyle('b', parent=base['Normal'], fontName='Helvetica', fontSize=9.5, leading=13.5, spaceAfter=4)
CELL = ParagraphStyle('c', parent=BODY, fontSize=8.5, leading=11, spaceAfter=0)


def p(text, style=BODY):
    return Paragraph(text, style)


def bullets(items, numbered=False):
    kind = dict(bulletType='1', bulletFormat='%s', bulletFontName='Helvetica', bulletFontSize=10) if numbered else dict(
        bulletType='bullet', start='•', bulletFontSize=9)
    return ListFlowable([ListItem(p(i), leftIndent=14) for i in items], leftIndent=14, spaceAfter=4, **kind)


def table(rows, widths):
    data = [[p(cell, CELL) for cell in row] for row in rows]
    t = Table(data, colWidths=widths, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e9eef5')),
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#9aa5b1')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    return t


story = [
    p('SaaS-O-Matic — Tutorial de uso', TITLE),
    p('Guía para el equipo comercial', SUB),

    p('Introducción', H1),
    p('SaaS-O-Matic permite al equipo comercial registrar clientes corporativos, simular el coste mensual de su '
      'suscripción y ver los importes en la divisa que prefiera. Para arrancarla en local, sigue el README del '
      'repositorio y abre http://localhost:5173 en el navegador.'),

    p('1. Pantalla principal: resumen y buscador', H1),
    p('En la parte superior verás el <b>resumen</b> de la actividad comercial:'),
    bullets([
        '<b>Clientes</b> registrados y <b>simulaciones guardadas</b>.',
        '<b>Facturación mensual estimada</b>: suma la última simulación de cada cliente, es decir, su presupuesto '
        'vigente. Si a un cliente le has hecho varias simulaciones, solo cuenta la más reciente.',
        '<b>Media por cliente</b> y número de <b>clientes por plan</b>.',
        'Los importes aparecen en la divisa seleccionada en la cabecera.',
    ]),
    p('Debajo está el <b>buscador</b>:'),
    bullets([
        'Escribe parte del nombre de la empresa o su identificador fiscal. No importan las mayúsculas ni las '
        'tildes, y en el identificador fiscal tampoco los guiones ni los espacios.',
        'Los resultados aparecen como tarjetas mientras escribes.',
        'Pulsa una tarjeta para abrir el detalle del cliente.',
    ]),

    p('2. Dar de alta un cliente', H1),
    bullets([
        'Pulsa "Nuevo cliente".',
        'Rellena nombre de empresa, país, identificador fiscal, email y plan. Elige el país antes que el '
        'identificador: es necesario para comprobarlo.',
        'El identificador fiscal se comprueba al salir del campo, sin esperar a guardar. Si es correcto verás, por '
        'ejemplo, "Correcto: CIF válido, carácter de control correcto. Se guardará como B12345674". Si hay un '
        'error, se indica qué revisar y el mensaje se actualiza mientras lo corriges.',
        'Pulsa "Guardar". Si ya existe un cliente con ese identificador, se te avisará y aparecerá el enlace '
        '"Ver el cliente existente".',
    ], numbered=True),
    p('Solo se pueden registrar clientes de la Unión Europea, Reino Unido y Estados Unidos.'),
    p('Identificadores fiscales admitidos', H3),
    table([
        ['País', 'Qué se comprueba'],
        ['España', 'DNI, NIE, NIF de tipo K, L o M y CIF, con su letra o dígito de control oficial.'],
        ['Resto de países', 'Solo el formato: de 5 a 20 letras o números.'],
    ], [32 * mm, 128 * mm]),

    p('3. Detalle del cliente', H1),
    p('Muestra los datos de la empresa, su plan con los límites incluidos y el historial de simulaciones '
      'guardadas, de la más reciente a la más antigua. Pulsa cualquier simulación del historial para verla '
      'completa (ver apartado 5).'),

    KeepTogether([
        p('4. Simular una factura', H1),
        bullets([
            'Desde el detalle, pulsa "Nueva simulación".',
            'Mueve el slider para elegir los usuarios activos (de 1 a 10.000) o escribe el número exacto en el '
            'campo "Usuarios activos".',
            'Indica el almacenamiento en GB y las llamadas a la API estimadas.',
            'La factura se actualiza al momento: coste base, desglose por tramos, IVA y total.',
            'Si superas los límites del plan, verás un aviso. Puedes guardar igualmente.',
            'Pulsa "Guardar simulación" para añadirla al historial.',
        ], numbered=True),
    ]),
    KeepTogether([
        p('Cómo se calcula el precio', H3),
        table([
            ['Tramo', 'Precio por usuario'],
            ['Del usuario 1 al 10', '10 €'],
            ['Del 11 al 50', '8 €'],
            ['Del 51 en adelante', '5 €'],
        ], [70 * mm, 70 * mm]),
        Spacer(1, 4),
        p('Cada usuario se cobra al precio de su tramo. Ejemplo: 15 usuarios = 10 × 10 € + 5 × 8 € = 140 €, más '
          'el IVA del país del cliente.'),
    ]),

    p('5. Consultar una simulación guardada', H1),
    bullets([
        'En el detalle del cliente, pulsa una simulación del historial.',
        'Se abre en la misma pantalla del simulador, en <b>solo lectura</b>: el slider y los campos están '
        'bloqueados y no hay botón de guardar.',
        'Los importes son los que se calcularon al guardarla. Aunque después cambien los precios de los tramos o '
        'el IVA, la simulación guardada no cambia.',
        'Puedes cambiar la divisa para ver sus importes convertidos.',
        'Pulsa "Volver al cliente" para regresar. Para hacer una simulación nueva, usa "Nueva simulación".',
    ], numbered=True),

    p('6. Cambiar la divisa', H1),
    p('En la cabecera tienes el selector de divisa. Al cambiarla, todos los importes (resumen, historial, '
      'simulador y simulaciones guardadas) se convierten al momento con el tipo de cambio del día. Los importes se '
      'guardan siempre en euros; la conversión es solo de visualización. Si el servicio de divisas no está '
      'disponible, se usan los últimos tipos guardados, indicando su fecha, o los importes se muestran en euros.'),

    p('7. Avisos y errores', H1),
    table([
        ['Mensaje', 'Qué significa'],
        ['Tipos de cambio no disponibles',
         'No se pudo conectar con el servicio de divisas; se usan los últimos tipos guardados (con su fecha) o se '
         'muestra en euros. Puedes pulsar "Reintentar".'],
        ['El servidor no responde / No se puede conectar con el servidor',
         'La aplicación no contesta. Pulsa "Reintentar" en unos segundos.'],
        ['El identificador fiscal no es válido', 'Revisa los números y la letra o dígito de control.'],
        ['Selecciona el país para comprobar el identificador fiscal',
         'Elige primero el país: de él depende cómo se comprueba el identificador.'],
        ['Ya existe un cliente con este identificador',
         'Búscalo en el buscador o pulsa "Ver el cliente existente" en lugar de crearlo de nuevo.'],
        ['El almacenamiento o las llamadas a la API superan el plan',
         'La simulación supera lo incluido en el plan del cliente. Es un aviso: puedes guardarla igualmente.'],
        ['No existe la simulación indicada',
         'La simulación no existe o no pertenece a ese cliente. Vuelve al detalle del cliente.'],
    ], [62 * mm, 98 * mm]),
]

doc = SimpleDocTemplate(str(OUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm,
                        bottomMargin=16 * mm, title='SaaS-O-Matic — Tutorial de uso',
                        author='SaaS-O-Matic', subject='Guía para el equipo comercial')
doc.build(story)
print(f'Generado {OUT}')
