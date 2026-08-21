package com.medtrack.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SparePartDeductionItemTest {

    @Test
    void parsePartsUsed_ReturnsEmptyListWhenInputNullOrBlank() {
        assertTrue(SparePartDeductionItem.parsePartsUsed(null).isEmpty());
        assertTrue(SparePartDeductionItem.parsePartsUsed("   ").isEmpty());
    }

    @Test
    void parsePartsUsed_ParsesColonSeparatedQuantities() {
        List<SparePartDeductionItem> items =
                SparePartDeductionItem.parsePartsUsed("PRT-001: 5, PRT-002: 10");

        assertEquals(2, items.size());
        assertEquals("PRT-001", items.get(0).getPartNumber());
        assertEquals(5, items.get(0).getQuantity());
        assertEquals("PRT-002", items.get(1).getPartNumber());
        assertEquals(10, items.get(1).getQuantity());
    }

    @Test
    void parsePartsUsed_ParsesParenthesesFormat() {
        List<SparePartDeductionItem> items =
                SparePartDeductionItem.parsePartsUsed("FILTER-A (3); GASKET-B (1)");

        assertEquals(2, items.size());
        assertEquals("FILTER-A", items.get(0).getPartNumber());
        assertEquals(3, items.get(0).getQuantity());
        assertEquals("GASKET-B", items.get(1).getPartNumber());
        assertEquals(1, items.get(1).getQuantity());
    }

    @Test
    void parsePartsUsed_DefaultsQuantityToOneWhenQuantityInvalidOrMissing() {
        List<SparePartDeductionItem> items =
                SparePartDeductionItem.parsePartsUsed("VALVE-X: invalid, TUBE-Y");

        assertEquals(2, items.size());
        assertEquals("VALVE-X", items.get(0).getPartNumber());
        assertEquals(1, items.get(0).getQuantity());
        assertEquals("TUBE-Y", items.get(1).getPartNumber());
        assertEquals(1, items.get(1).getQuantity());
    }
}
