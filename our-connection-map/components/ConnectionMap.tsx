
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { User, Connection } from '../types';

interface Props {
  users: User[];
  connections: Connection[];
}

// D3 링크 형식으로 변환된 연결 인터페이스
interface D3Link {
  source: string;
  target: string;
  commonTraits: string[];
  groupSize: number;
}

const ConnectionMap: React.FC<Props> = ({ users, connections }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // connections를 D3 링크 형식으로 변환 (2인 및 3인 그룹 지원)
  const d3Links = useMemo(() => {
    const links: D3Link[] = [];

    connections.forEach(conn => {
      if (!conn.userIds || conn.userIds.length < 2) return;

      if (conn.userIds.length === 2) {
        // 2인 연결
        links.push({
          source: conn.userIds[0],
          target: conn.userIds[1],
          commonTraits: conn.commonTraits || [],
          groupSize: 2
        });
      } else if (conn.userIds.length === 3) {
        // 3인 연결: 삼각형 형태로 3개의 링크 생성
        links.push({
          source: conn.userIds[0],
          target: conn.userIds[1],
          commonTraits: conn.commonTraits || [],
          groupSize: 3
        });
        links.push({
          source: conn.userIds[1],
          target: conn.userIds[2],
          commonTraits: conn.commonTraits || [],
          groupSize: 3
        });
        links.push({
          source: conn.userIds[2],
          target: conn.userIds[0],
          commonTraits: conn.commonTraits || [],
          groupSize: 3
        });
      }
    });

    return links;
  }, [connections]);

  // 현재 매칭 중인 링크 생성 (실시간 표시용)
  const activeMatchLinks = useMemo(() => {
    const links: D3Link[] = [];
    const processedPairs = new Set<string>();

    users.forEach(user => {
      if (user.currentMatchId) {
        // 2인 매칭
        const pairKey = [user.id, user.currentMatchId].sort().join('-');
        if (!processedPairs.has(pairKey)) {
          links.push({
            source: user.id,
            target: user.currentMatchId,
            commonTraits: [],
            groupSize: 2
          });
          processedPairs.add(pairKey);
        }
      } else if (user.currentMatchIds?.length) {
        // 3인 매칭
        const allIds = [user.id, ...user.currentMatchIds].sort();
        const groupKey = allIds.join('-');
        if (!processedPairs.has(groupKey)) {
          // 삼각형 링크
          links.push({ source: allIds[0], target: allIds[1], commonTraits: [], groupSize: 3 });
          links.push({ source: allIds[1], target: allIds[2], commonTraits: [], groupSize: 3 });
          links.push({ source: allIds[2], target: allIds[0], commonTraits: [], groupSize: 3 });
          processedPairs.add(groupKey);
        }
      }
    });

    return links;
  }, [users]);

  useEffect(() => {
    if (!svgRef.current || users.length === 0) return;

    const width = window.innerWidth;
    const height = window.innerHeight - 100;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    // Filters for glow
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // 노드 데이터 복제 (D3가 수정하므로)
    const nodeData = users.map(u => ({ ...u }));

    // 모든 링크 합치기 (완료된 연결 + 진행 중인 매칭)
    const allLinks = [...d3Links, ...activeMatchLinks];

    // 유효한 링크만 필터링 (존재하는 사용자 ID만)
    const userIds = new Set(users.map(u => u.id));
    const validLinks = allLinks.filter(
      link => userIds.has(link.source) && userIds.has(link.target)
    );

    const gActiveLinks = svg.append('g').attr('class', 'active-links');
    const gLinks = svg.append('g').attr('class', 'links');
    const gNodes = svg.append('g').attr('class', 'nodes');
    const gLabels = svg.append('g').attr('class', 'labels');

    const simulation = d3.forceSimulation<any>(nodeData)
      .force('link', d3.forceLink<any, any>(validLinks).id((d: any) => d.id).distance(220))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(90));

    // 완료된 연결 (실선)
    const completedLinks = validLinks.filter(l =>
      d3Links.some(dl =>
        (dl.source === l.source && dl.target === l.target) ||
        (dl.source === l.target && dl.target === l.source)
      )
    );

    // 진행 중인 매칭 (점선, 애니메이션)
    const activeLinks = validLinks.filter(l =>
      activeMatchLinks.some(al =>
        (al.source === l.source && al.target === l.target) ||
        (al.source === l.target && al.target === l.source)
      ) && !d3Links.some(dl =>
        (dl.source === l.source && dl.target === l.target) ||
        (dl.source === l.target && dl.target === l.source)
      )
    );

    // 진행 중인 매칭 링크 (점선 + 애니메이션)
    const activeLink = gActiveLinks.selectAll('path')
      .data(activeLinks)
      .enter().append('path')
      .attr('fill', 'none')
      .attr('stroke', d => d.groupSize === 3 ? '#8b5cf6' : '#ff6b6b')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '12,6')
      .style('animation', 'dash 1s linear infinite');

    // 완료된 연결 링크 (실선)
    const link = gLinks.selectAll('path')
      .data(completedLinks)
      .enter().append('path')
      .attr('fill', 'none')
      .attr('stroke', d => d.groupSize === 3 ? '#8b5cf6' : '#ff9f40')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', d => d.groupSize === 3 ? 3.5 : 2.5);

    // Link Labels (완료된 연결에만)
    const linkLabels = gLabels.selectAll('g')
      .data(completedLinks.filter(l => l.commonTraits.length > 0))
      .enter().append('g')
      .attr('class', 'pointer-events-none');

    linkLabels.append('rect')
      .attr('fill', 'white')
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('height', 22)
      .attr('opacity', 0.9);

    linkLabels.append('text')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', d => d.groupSize === 3 ? '#7c3aed' : '#e63946')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .text(d => d.commonTraits.slice(0, 2).map(t => '#' + t).join(' '));

    // Nodes
    const node = gNodes.selectAll('g')
      .data(nodeData)
      .enter().append('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Circle Node
    node.append('circle')
      .attr('r', 40)
      .attr('fill', 'white')
      .attr('stroke', d => {
        if (d.currentMatchIds?.length) return '#8b5cf6'; // 3인 매칭
        if (d.currentMatchId) return '#ff6b6b'; // 2인 매칭
        return '#ff9f40'; // 대기 중
      })
      .attr('stroke-width', 4)
      .attr('style', 'filter: url(#glow)')
      .attr('class', d => (d.currentMatchId || d.currentMatchIds?.length) ? 'animate-pulse' : '');

    // User Icon
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-family', 'FontAwesome')
      .attr('font-size', '24px')
      .attr('fill', d => {
        if (d.currentMatchIds?.length) return '#8b5cf6';
        if (d.currentMatchId) return '#ff6b6b';
        return '#ff9f40';
      })
      .text('\uf007');

    // Name
    node.append('text')
      .attr('y', 60)
      .attr('text-anchor', 'middle')
      .attr('fill', '#4a3737')
      .attr('font-weight', '900')
      .attr('font-size', '13px')
      .text(d => d.name);

    // Dept
    node.append('text')
      .attr('y', 76)
      .attr('text-anchor', 'middle')
      .attr('fill', '#998d8d')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(d => d.department);

    // Score badge
    node.append('circle')
      .attr('cx', 28)
      .attr('cy', -28)
      .attr('r', 16)
      .attr('fill', d => (d.score || 0) > 0 ? '#10b981' : '#e5e7eb');

    node.append('text')
      .attr('x', 28)
      .attr('y', -28)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', d => (d.score || 0) > 0 ? 'white' : '#9ca3af')
      .text(d => d.score || 0);

    simulation.on('tick', () => {
      // 모든 링크 패스 업데이트
      const updateLinkPath = (selection: any) => {
        selection.attr('d', (d: any) => {
          if (!d.source?.x || !d.target?.x) return '';
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          const dr = Math.sqrt(dx * dx + dy * dy);
          return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
        });
      };

      updateLinkPath(link);
      updateLinkPath(activeLink);

      linkLabels.attr('transform', (d: any) => {
        if (!d.source?.x || !d.target?.x) return '';
        const x = (d.source.x + d.target.x) / 2;
        const y = (d.source.y + d.target.y) / 2;
        return `translate(${x},${y})`;
      });

      linkLabels.each(function(d: any) {
        if (!d.source?.x) return;
        const g = d3.select(this);
        const textNode = g.select('text').node() as SVGTextElement;
        if (textNode) {
          const bbox = textNode.getBBox();
          g.select('rect')
            .attr('x', bbox.x - 8)
            .attr('y', bbox.y - 2)
            .attr('width', bbox.width + 16);
        }
      });

      node.attr('transform', (d: any) => `translate(${d.x || 0},${d.y || 0})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => simulation.stop();
  }, [users, d3Links, activeMatchLinks]);

  return (
    <>
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -18;
          }
        }
      `}</style>
      <svg ref={svgRef} className="w-full h-full" />
    </>
  );
};

export default ConnectionMap;
