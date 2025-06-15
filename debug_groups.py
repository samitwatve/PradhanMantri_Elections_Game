import json

with open('states_data.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

print("Checking potentially problematic groups:")
print()

# Check Union Territory group
union_territories = [state for state in data if state['UnionTerritory'] == 'TRUE']
print(f"Union Territory group ({len(union_territories)} states/UTs):")
for ut in union_territories:
    print(f"  {ut['State']}: {ut['SvgId']}")
print()

# Check Coastal India group
coastal = [state for state in data if state['CoastalIndia'] == 'TRUE']
print(f"Coastal India group ({len(coastal)} states/UTs):")
for state in coastal:
    print(f"  {state['State']}: {state['SvgId']}")
print()

# Check Travel and Tourism group
tourism = [state for state in data if state['TravelAndTourism'] == 'TRUE']
print(f"Travel and Tourism group ({len(tourism)} states/UTs):")
for state in tourism:
    print(f"  {state['State']}: {state['SvgId']}")
print()

# Verify Lakshadweep is in all these groups
lakshadweep = [state for state in data if 'Lakshadweep' in state['State']]
if lakshadweep:
    state = lakshadweep[0]
    print("Lakshadweep details:")
    print(f"  State: {state['State']}")
    print(f"  SvgId: {state['SvgId']}")
    print(f"  Union Territory: {state['UnionTerritory']}")
    print(f"  Coastal India: {state['CoastalIndia']}")
    print(f"  Travel and Tourism: {state['TravelAndTourism']}")
else:
    print("Lakshadweep not found!")
