package com.medtrack.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.util.EnumSet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The decommissioned/in-service split is consulted by background jobs and dashboards to decide
 * whether an asset is still worth acting on. These checks pin the membership down so that adding a
 * status without classifying it fails here rather than silently changing what the warranty alert
 * job, the preventive-maintenance engine or the analytics tiles consider actionable.
 */
@DisplayName("EquipmentStatus fleet membership")
class EquipmentStatusTest {

    @Test
    @DisplayName("retired and disposed are the decommissioned statuses")
    void decommissionedMembership() {
        assertThat(EquipmentStatus.DECOMMISSIONED)
                .containsExactlyInAnyOrder(EquipmentStatus.RETIRED, EquipmentStatus.DISPOSED);
    }

    @Test
    @DisplayName("active and under-maintenance are the in-service statuses")
    void inServiceMembership() {
        assertThat(EquipmentStatus.IN_SERVICE)
                .containsExactlyInAnyOrder(EquipmentStatus.ACTIVE, EquipmentStatus.UNDER_MAINTENANCE);
    }

    @ParameterizedTest
    @EnumSource(EquipmentStatus.class)
    @DisplayName("every status is classified exactly once")
    void everyStatusIsClassified(EquipmentStatus status) {
        assertThat(status.isDecommissioned()).isNotEqualTo(status.isInService());
        assertThat(EquipmentStatus.DECOMMISSIONED.contains(status)
                ^ EquipmentStatus.IN_SERVICE.contains(status)).isTrue();
    }

    @Test
    @DisplayName("the two sets together cover the whole enum")
    void theSetsPartitionTheEnum() {
        EnumSet<EquipmentStatus> union = EnumSet.noneOf(EquipmentStatus.class);
        union.addAll(EquipmentStatus.DECOMMISSIONED);
        union.addAll(EquipmentStatus.IN_SERVICE);

        assertThat(union).containsExactlyInAnyOrder(EquipmentStatus.values());
    }

    @Test
    @DisplayName("an asset under maintenance has not left the fleet")
    void underMaintenanceIsNotDecommissioned() {
        assertThat(EquipmentStatus.UNDER_MAINTENANCE.isDecommissioned()).isFalse();
        assertThat(EquipmentStatus.UNDER_MAINTENANCE.isInService()).isTrue();
    }

    @Test
    @DisplayName("the exposed sets cannot be mutated by a caller")
    void theSetsAreImmutable() {
        assertThatThrownBy(() -> EquipmentStatus.DECOMMISSIONED.add(EquipmentStatus.ACTIVE))
                .isInstanceOf(UnsupportedOperationException.class);
        assertThatThrownBy(() -> EquipmentStatus.IN_SERVICE.remove(EquipmentStatus.ACTIVE))
                .isInstanceOf(UnsupportedOperationException.class);
    }
}
